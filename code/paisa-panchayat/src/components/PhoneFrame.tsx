"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const WIDTH = 390;
const HEIGHT = 844;
const BEZEL = 12;

/** The real app in an iframe at phone size, so its phone layout is what runs. It's a web preview, not a native app. */
export function PhoneFrame() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 32) / (HEIGHT + BEZEL * 2)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <main className="phone-stage">
      <div
        className="phone-slot"
        style={{ width: (WIDTH + BEZEL * 2) * scale, height: (HEIGHT + BEZEL * 2) * scale }}
      >
        <div className="phone-body" style={{ padding: BEZEL, transform: `scale(${scale})` }}>
          <iframe
            className="phone-screen"
            src="/"
            title="Paisa Panchayat, phone view"
            width={WIDTH}
            height={HEIGHT}
            allow="clipboard-read; clipboard-write"
          />
        </div>
      </div>
      <aside className="phone-note">
        <h1>Paisa Panchayat</h1>
        <p>A web preview at iPhone size, 390 × 844. It&apos;s the real app on synthetic data, but not a native app yet.</p>
        <p>Click the text box inside the phone, then speak with Wispr Flow.</p>
        <p><Link href="/">Open the full-screen version</Link></p>
      </aside>
    </main>
  );
}
