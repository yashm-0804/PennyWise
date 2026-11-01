/** Errors reach the screen as a readable message, not a stack trace. */
export function fail(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  console.error(err);
  return Response.json({ error: message }, { status: 500 });
}
