import type { TAppState } from "@/contract/schemas";

export class ApiError extends Error {}

async function read<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const said = body && typeof body.error === "string" ? body.error : null;
    throw new ApiError(said ?? `The server answered ${res.status}.`);
  }
  return body as T;
}

export async function post<T>(path: string, payload: unknown = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  } catch {
    throw new ApiError("Could not reach the server.");
  }
  return read<T>(res);
}

export async function getState(): Promise<TAppState> {
  let res: Response;
  try {
    res = await fetch("/api/state", { cache: "no-store" });
  } catch {
    throw new ApiError("Could not reach the server.");
  }
  return read<TAppState>(res);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ApiError("Could not read that file."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}
