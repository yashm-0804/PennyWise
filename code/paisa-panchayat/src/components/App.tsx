"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  TAppState, TCheckedItem, TDictateResponse, TImportResponse, TMunshiResponse, TNextMonthResponse, TPanchayat, TPriceCheck, TRulingResponse,
} from "@/contract/schemas";
import { ApiError, fileToBase64, getState, post } from "./api";
import { useAccountName } from "./account";
import { BellIcon, ChatIcon, CloseIcon, GoalIcon, HomeIcon, LedgerIcon, PanchayatIcon, PlusIcon, RulingIcon, SendIcon } from "./icons";
import { useTypingPulse, Wave } from "./motion";
import { ConfirmCard } from "./ConfirmCard";
import { looksLikeQuestion } from "@/lib/question";
import { newEventIds, simulatedMonths, stepForRoute } from "./flow";
import { GoalsTab } from "./GoalsTab";
import { KhataTab } from "./KhataTab";
import { MunshiChat, type MunshiEntry } from "./MunshiChat";
import { ImportControls, NoticesTab, type ImportArgs } from "./NoticesTab";
import { PanchayatConvening, PanchayatScreen, type OpenPanchayat } from "./PanchayatScreen";
import { ProfileTab } from "./ProfileTab";
import { SignIn } from "./SignIn";
import { StartScreen, type OrbTarget } from "./StartScreen";
import { Badge, ErrorBand, Working } from "./ui";

type Tab = "start" | "khata" | "goals" | "panchayat" | "notices" | "profile";
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "start", label: "Home", icon: <HomeIcon /> },
  { id: "khata", label: "Ledger", icon: <LedgerIcon /> },
  { id: "goals", label: "Goals", icon: <GoalIcon /> },
  { id: "panchayat", label: "Huddle", icon: <PanchayatIcon /> },
  { id: "notices", label: "Nudges", icon: <BellIcon /> },
];

/** The front door's box cycles through things to say, so it teaches what it can do. */
const START_HINTS = [
  "Swiggy pe 450 gaye",
  "Whom have I lent money to?",
  "What if I cut dining by 30%?",
  "Laptop died, new one is 70 thousand",
  "Mera EMI kitna jaata hai?",
];

type Busy =
  | { kind: "dictate" | "convene" | "ruling" | "munshi"; text: string }
  | { kind: "confirm" | "apply" | "next-month" | "ledger" | "reset" }
  | { kind: "import"; what: ImportArgs["kind"] };

type Failure = { message: string; retry?: () => void };

const SAVED_TEXT = "Bolo: what happened, or what if…";
const RULING_TEXT = "Say your ruling: “Goa moves to June…”";

function ResetControl({ busy, onReset }: { busy: boolean; onReset: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <button type="button" className="reset-link" disabled={busy} onClick={() => setAsking(true)}>Reset demo</button>;
  return (
    <span className="reset-ask">
      Reset everything?{" "}
      <button type="button" className="reset-link" onClick={() => { setAsking(false); onReset(); }}>Yes</button>{" "}
      <button type="button" className="reset-link" onClick={() => setAsking(false)}>No</button>
    </span>
  );
}

export function App() {
  const [state, setState] = useState<TAppState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const name = useAccountName();
  const [tab, setTab] = useState<Tab>("start");
  const [plusOpen, setPlusOpen] = useState(false);
  const [hint, setHint] = useState(0);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<TDictateResponse | null>(null);
  const [panchayat, setPanchayat] = useState<OpenPanchayat | null>(null);
  const [munshi, setMunshi] = useState<MunshiEntry[]>([]);
  const [munshiOpen, setMunshiOpen] = useState(false);
  const [typing, pingTyping] = useTypingPulse();
  const [saved, setSaved] = useState<{ count: number; ids: string[] } | null>(null);
  const [freshIds, setFreshIds] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, TPriceCheck>>({});
  const [nextMonth, setNextMonth] = useState<TNextMonthResponse | null>(null);
  const [simRun, setSimRun] = useState<string[]>([]);
  const [movedFrom, setMovedFrom] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<TImportResponse | null>(null);

  const box = useRef<HTMLTextAreaElement>(null);
  const chatBox = useRef<HTMLTextAreaElement>(null);
  const chatOpen = useRef(false);
  useEffect(() => { chatOpen.current = munshiOpen; }, [munshiOpen]);
  const munshiSeq = useRef(0);
  const stateRef = useRef<TAppState | null>(null);

  /** Wispr Flow types into whatever has focus, so focus comes home after every action. */
  const focusBar = useCallback(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return; // Don't pop the phone keyboard.
    const active = document.activeElement;
    const home = chatOpen.current ? chatBox.current : box.current;
    if (active instanceof HTMLInputElement || (active instanceof HTMLTextAreaElement && active !== home)) return;
    home?.focus({ preventScroll: true });
  }, []);

  const refresh = useCallback(async () => {
    const next = await getState();
    stateRef.current = next;
    setState(next);
    setLoadError(null);
    return next;
  }, []);

  useEffect(() => {
    let live = true;
    getState().then(
      (next) => {
        if (!live) return;
        stateRef.current = next;
        setState(next);
      },
      (e: unknown) => { if (live) setLoadError(e instanceof Error ? e.message : "Could not load."); },
    );
    box.current?.focus({ preventScroll: true });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, a, label, .why")) return;
      focusBar();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [focusBar]);

  useEffect(() => {
    if (name) focusBar();
  }, [name, focusBar]);

  useEffect(() => {
    if (tab !== "start" || text) return;
    const timer = setInterval(() => setHint((h) => (h + 1) % START_HINTS.length), 2800);
    return () => clearInterval(timer);
  }, [tab, text]);

  /** Every call goes through here, so busy, errors, retry and focus behave the same everywhere. */
  const run = useCallback((first: Busy, work: () => Promise<void>): Promise<void> => {
    const attempt = async () => {
      setBusy(first);
      setFailure(null);
      setInfo(null);
      try {
        await work();
      } catch (e) {
        const message = e instanceof ApiError ? e.message : "Something went wrong.";
        setFailure({ message, retry: () => { void attempt(); } });
      } finally {
        setBusy(null);
        focusBar();
      }
    };
    return attempt();
  }, [focusBar]);

  const convene = async (raw: string, utteranceId: string) => {
    setBusy({ kind: "convene", text: raw });
    setConfirm(null);
    setPanchayat(null);
    setTab("panchayat");
    const data = await post<TPanchayat>("/api/panchayat", { text: raw, utteranceId });
    setPanchayat({ data, ruling: null, applied: false });
  };

  const askMunshi = async (raw: string) => {
    setBusy({ kind: "munshi", text: raw });
    // The front door answers in place. Everywhere else, Buggy's window opens.
    setMunshiOpen(tab !== "start");
    const res = await post<TMunshiResponse>("/api/munshi", { text: raw });
    munshiSeq.current += 1;
    setMunshi((m) => [{ id: munshiSeq.current, question: raw, res }, ...m]);
    const price = res.price;
    if (price) setPrices((all) => ({ ...all, [price.goalId]: price }));
    await refresh();
  };

  const ruleOn = (raw: string, open: OpenPanchayat) => run({ kind: "ruling", text: raw }, async () => {
    setText("");
    try {
      const res = await post<TRulingResponse>("/api/ruling", { panchayatId: open.data.id, text: raw });
      setPanchayat((p) => (p ? { ...p, ruling: { text: raw, res } } : p));
    } catch (e) {
      setText((cur) => cur || raw);
      throw e;
    }
  });

  /** Tapping a plan needs no parsing, so it spends no model call. */
  const choosePlan = (planId: string, label: string) => {
    const open = panchayat;
    if (!open || open.applied) return;
    void run({ kind: "ruling", text: label }, async () => {
      const res = await post<TRulingResponse>("/api/ruling", { panchayatId: open.data.id, text: label, ops: [{ op: "choose_plan", planId }] });
      setPanchayat((p) => (p ? { ...p, ruling: { text: label, res } } : p));
    });
  };

  /** The chat box takes questions. A statement such as a correction still goes through the confirm card. */
  const sendFromChat = (raw: string) => {
    if (looksLikeQuestion(raw)) {
      askDirect(raw);
      return;
    }
    setMunshiOpen(false);
    void dictate(raw);
  };

  /** Puts a suggestion in the box for the user to edit or send. */
  const suggest = (line: string) => {
    setText(line);
    box.current?.focus({ preventScroll: true });
  };

  const askDirect = (line: string) => {
    if (busy) return;
    void run({ kind: "munshi", text: line }, () => askMunshi(line));
  };

  const dictate = (raw: string) => run({ kind: "dictate", text: raw }, async () => {
    setText("");
    setSaved(null);
    try {
      const reply = await post<TDictateResponse>("/api/dictate", { text: raw });
      setLastSent(reply.raw_text);
      const step = stepForRoute(reply.route);
      if (step === "confirm") setConfirm(reply);
      else if (step === "panchayat") await convene(reply.raw_text, reply.utteranceId);
      else if (step === "munshi") await askMunshi(reply.raw_text);
      else setInfo("That sounds like a ruling, but no panchayat is open. Say the expense or what-if first.");
    } catch (e) {
      setText((cur) => cur || raw);
      throw e;
    }
  });

  const submit = () => {
    const raw = text.trim();
    if (!raw || busy) return;
    setLastSent(raw);
    if (panchayat && !panchayat.applied && tab === "panchayat") void ruleOn(raw, panchayat);
    else if (looksLikeQuestion(raw)) {
      // A question goes straight to Buggy, without spending a router call.
      setText("");
      askDirect(raw);
    } else void dictate(raw);
  };

  const confirmItems = (items: TCheckedItem[]) => {
    const reply = confirm;
    if (!reply) return;
    void run({ kind: "confirm" }, async () => {
      const before = stateRef.current;
      const res = await post<{ panchayat?: TPanchayat | null }>("/api/confirm", { utteranceId: reply.utteranceId, items });
      const after = await refresh();
      const ids = newEventIds(before, after);
      setConfirm(null);
      setFreshIds(ids);
      setSaved({ count: items.length, ids });
      if (res.panchayat) {
        setPanchayat({ data: res.panchayat, ruling: null, applied: false });
        setTab("panchayat");
      } else {
        setTab((t) => (t === "start" ? "start" : "khata"));
      }
    });
  };

  const undoSaved = (ids: string[]) => run({ kind: "ledger" }, async () => {
    for (const eventId of ids) await post("/api/undo", { eventId });
    await refresh();
    setSaved(null);
    setFreshIds([]);
  });

  const undoOne = (eventId: string) => run({ kind: "ledger" }, async () => {
    await post("/api/undo", { eventId });
    await refresh();
  });

  const undoRule = (ruleId: string) => run({ kind: "ledger" }, async () => {
    await post("/api/rule-undo", { ruleId });
    await refresh();
  });

  const setTreatment = (eventId: string, treatment: "transfer" | "spend") => run({ kind: "ledger" }, async () => {
    await post("/api/withdrawal", { eventId, treatment });
    await refresh();
  });

  const applyRuling = () => {
    const open = panchayat;
    if (!open?.ruling) return;
    const { text: rulingText, res } = open.ruling;
    void run({ kind: "apply" }, async () => {
      const applied = await post<TRulingResponse>("/api/ruling", { panchayatId: open.data.id, text: rulingText, ops: res.ops, apply: true });
      // The preview's diff drives the animation: once applied, a re-computed diff has nothing left to show.
      setPanchayat((p) => (p?.ruling ? { ...p, applied: true, ruling: { ...p.ruling, res: { ...applied, diff: res.diff } } } : p));
      await refresh();
    });
  };

  const closePanchayat = () => {
    const wasApplied = panchayat?.applied;
    setPanchayat(null);
    setTab(wasApplied ? "goals" : "start");
  };

  const runNextMonth = () => run({ kind: "next-month" }, async () => {
    const goals = stateRef.current?.goals ?? [];
    const res = await post<TNextMonthResponse>("/api/next-month");
    setMovedFrom(Object.fromEntries(goals.map((g) => [g.id, g.projectedMonth])));
    setNextMonth(res);
    setSimRun((m) => (m.includes(res.month) ? m : [...m, res.month]));
    await refresh();
  });

  const runImport = ({ kind, text: pasted, file, password }: ImportArgs) => run({ kind: "import", what: kind }, async () => {
    setImportResult(null);
    const payload = kind === "pdf" && file
      ? { kind, base64: await fileToBase64(file), password }
      : { kind, text: file ? await file.text() : pasted };
    setImportResult(await post<TImportResponse>("/api/import", payload));
    await refresh();
    focusBar();
  });

  const reset = () => run({ kind: "reset" }, async () => {
    await post("/api/reset");
    setConfirm(null);
    setPanchayat(null);
    setMunshi([]);
    setMunshiOpen(false);
    setSaved(null);
    setFreshIds([]);
    setPrices({});
    setNextMonth(null);
    setSimRun([]);
    setMovedFrom({});
    setImportResult(null);
    setLastSent(null);
    setTab("start");
    await refresh();
  });

  const rulingMode = Boolean(panchayat && !panchayat.applied && tab === "panchayat");
  const huddleOpen = Boolean(panchayat && !panchayat.applied);
  const onStart = tab === "start";
  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const simMonths = simulatedMonths(state, simRun);
  const noticeCount = state?.notices.length ?? 0;

  const body = () => {
    if (!state) {
      if (loadError) {
        return (
          <ErrorBand
            message={loadError}
            onRetry={() => { void refresh().catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Could not load.")); }}
          />
        );
      }
      return <Working title="Opening your ledger" />;
    }
    if (busy?.kind === "dictate" && !onStart) return <Working title="Reading what you said" quote={busy.text} detail="Every amount is checked against your words." />;
    if (confirm && !onStart) {
      return (
        <ConfirmCard
          key={confirm.utteranceId}
          reply={confirm}
          saving={busy?.kind === "confirm"}
          onConfirm={confirmItems}
          onDiscard={() => setConfirm(null)}
        />
      );
    }
    switch (tab) {
      case "start":
        return (
          <StartScreen
            state={state}
            name={name ?? ""}
            entries={munshi}
            working={busy && (busy.kind === "munshi" || busy.kind === "dictate") ? busy.text : null}
            noticeCount={noticeCount}
            huddleOpen={huddleOpen}
            onOpen={(target: OrbTarget) => { setSaved(null); setTab(target); }}
            onStartOver={() => setMunshi([])}
          />
        );
      case "profile":
        return (
          <ProfileTab
            state={state}
            name={name ?? ""}
            onSuggest={suggest}
            onAskBuggy={() => setMunshiOpen(true)}
            resetControl={<ResetControl busy={busy !== null} onReset={reset} />}
          />
        );
      case "khata":
        return (
          <KhataTab
            state={state}
            freshIds={freshIds}
            busy={busy !== null}
            onUndo={undoOne}
            onTreatment={setTreatment}
            onSuggest={suggest}
            onGoals={() => setTab("goals")}
            resetControl={<ResetControl busy={busy !== null} onReset={reset} />}
          />
        );
      case "goals":
        return <GoalsTab state={state} prices={prices} onSuggest={suggest} />;
      case "panchayat":
        if (busy?.kind === "convene") return <PanchayatConvening text={busy.text} state={state} />;
        if (panchayat) {
          return (
            <PanchayatScreen
              key={panchayat.data.id}
              open={panchayat}
              state={state}
              rulingBusy={busy?.kind === "ruling" ? busy.text : null}
              applyBusy={busy?.kind === "apply"}
              onApply={applyRuling}
              onClose={closePanchayat}
              onChoose={choosePlan}
            />
          );
        }
        return (
          <div className="panchayat-empty view">
            <span className="panchayat-empty-icon" aria-hidden="true">⚖️</span>
            <h1 className="page-title">Your goals are at peace</h1>
            <p className="muted">When a big expense comes up, they gather here and argue it out. You make the final call.</p>
            <div className="chips chips-center">
              <button type="button" className="chip" onClick={() => suggest("Laptop died, new one is 70 thousand, need it this month")}>💻 Laptop died, new one is 70 thousand</button>
              <button type="button" className="chip" onClick={() => suggest("What if I cut dining by 30%?")}>🤔 What if I cut dining by 30%?</button>
            </div>
            {state.panchayats.length > 0 ? <p className="muted small">Past rulings are under Nudges.</p> : null}
          </div>
        );
      case "notices":
        return (
          <NoticesTab
            state={state}
            nextMonth={nextMonth}
            simMonths={simMonths}
            movedFrom={movedFrom}
            nextBusy={busy?.kind === "next-month"}
            importBusy={busy?.kind === "import" ? busy.what : null}
            importResult={importResult}
            onNextMonth={runNextMonth}
            onImport={runImport}
          />
        );
    }
  };

  const showSaved = saved && tab !== "panchayat" && !confirm;

  if (name === undefined) return <div className="app is-start" />;
  if (name === null) return <SignIn />;

  return (
    <div className={`app ${onStart ? "is-start" : ""} ${onStart && typing ? "is-typing" : ""}`}>
      <header className="top">
        <div className="top-inner">
          <span className="brand"><span className="brand-mark" aria-hidden="true">₹</span> PennyWise</span>
          <span className="top-right">
            <Badge tone="onink">Synthetic data</Badge>
            <button type="button" className="top-avatar" aria-label="Your profile" onClick={() => { setConfirm(null); setTab("profile"); }}>{name.charAt(0).toUpperCase()}</button>
          </span>
        </div>
      </header>

      <main className="main">
        {failure || info || showSaved ? (
          <div className="banners">
            {failure ? <ErrorBand message={failure.message} onRetry={failure.retry} onDismiss={() => setFailure(null)} /> : null}
            {info ? <div className="info-band" role="status"><span>{info}</span><button type="button" className="text-link" onClick={() => setInfo(null)}>Dismiss</button></div> : null}
            {showSaved && saved ? (
              <div className="saved-band" role="status">
                <span><b>✓ Saved {saved.count} {saved.count === 1 ? "entry" : "entries"}.</b></span>
                {saved.ids.length > 0 ? (
                  <span className="row-gap">
                    {onStart ? <button type="button" className="btn btn-quiet btn-small" onClick={() => { setSaved(null); setTab("khata"); }}>See ledger</button> : null}
                    <button type="button" className="btn btn-quiet btn-small" disabled={busy !== null} onClick={() => undoSaved(saved.ids)}>Undo</button>
                  </span>
                ) : (
                  <span className="muted small">Undo any row in your ledger.</span>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
        <div key={confirm && !onStart ? "confirm" : tab} className="view-anim">{body()}</div>
      </main>

      {onStart && confirm ? (
        <div className="chat-layer">
          <button type="button" className="chat-scrim" aria-label="Discard" tabIndex={-1} onClick={() => setConfirm(null)} />
          <section className="sheet" aria-label="Confirm entries">
            <ConfirmCard
              key={confirm.utteranceId}
              reply={confirm}
              saving={busy?.kind === "confirm"}
              onConfirm={confirmItems}
              onDiscard={() => setConfirm(null)}
            />
          </section>
        </div>
      ) : null}
      {plusOpen ? (
        <div className="chat-layer">
          <button type="button" className="chat-scrim" aria-label="Close" tabIndex={-1} onClick={() => setPlusOpen(false)} />
          <section className="sheet sheet-pad" aria-label="Bring in your statements">
            <button type="button" className="sheet-close" aria-label="Close" onClick={() => setPlusOpen(false)}><CloseIcon /></button>
            <ImportControls busy={busy?.kind === "import" ? busy.what : null} result={importResult} onImport={runImport} />
          </section>
        </div>
      ) : null}
      {state && !munshiOpen && !onStart ? (
        <button type="button" className="munshi-fab" aria-label="Ask Buggy" onClick={() => setMunshiOpen(true)}>
          <ChatIcon />
          {busy?.kind === "munshi" ? <span className="fab-dot" /> : null}
        </button>
      ) : null}
      {state && munshiOpen ? (
        <MunshiChat
          state={state}
          entries={munshi}
          working={busy?.kind === "munshi" ? busy.text : null}
          busy={busy !== null}
          onSend={sendFromChat}
          onAsk={askDirect}
          onClose={() => setMunshiOpen(false)}
          onUndoRule={undoRule}
          inputRef={chatBox}
        />
      ) : null}

      <div className="dock">
        <div className="dock-inner">
          <form className={`bar ${rulingMode ? "is-ruling" : ""} ${onStart ? "is-start" : ""}`} onSubmit={(e) => { e.preventDefault(); submit(); }}>
            {onStart ? <button type="button" className="bar-plus" aria-label="Bring in statements" onClick={() => setPlusOpen(true)}><PlusIcon /></button> : null}
            <Wave active={typing} />
            <label className="visually-hidden" htmlFor="dictation">{rulingMode ? "Your ruling" : "Say something"}</label>
            <textarea
              id="dictation"
              ref={box}
              className="bar-input"
              rows={1}
              value={text}
              placeholder={rulingMode ? RULING_TEXT : onStart ? `Bolo: ${START_HINTS[hint]}` : SAVED_TEXT}
              onChange={(e) => { setText(e.target.value); pingTyping(); }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button type="submit" className="bar-send" aria-label={rulingMode ? "Rule" : "Send"} disabled={!text.trim() || busy !== null}>
              {busy && !["ledger", "import"].includes(busy.kind) ? "…" : rulingMode ? <RulingIcon /> : <SendIcon />}
            </button>
          </form>
          {onStart
            ? <p className="bar-hint">Speak with Wispr Flow, or type</p>
            : <p className="bar-hint">Speak with Wispr Flow{lastSent ? <> · <span title={lastSent}>Sent: {lastSent}</span></> : null}</p>}
          {!onStart ? (
            <nav className="tabs" role="tablist" aria-label="Sections">
              {tabIndex >= 0 ? <span className="tab-glider" aria-hidden="true" style={{ transform: `translateX(${tabIndex * 100}%)`, width: `${100 / TABS.length}%` }}><i /></span> : null}
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id && !confirm}
                  className="tab"
                  onClick={() => { setConfirm(null); setSaved(null); setTab(t.id); }}
                >
                  <span className="tab-icon">{t.icon}</span>
                  <span className="tab-label">{t.label}</span>
                  {t.id === "panchayat" && huddleOpen ? <span className="tab-dot" aria-label="open" /> : null}
                  {t.id === "notices" && noticeCount > 0 ? <span className="tab-count">{noticeCount}</span> : null}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
