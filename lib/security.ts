export type RequestIdentity = { email: string; name: string };

export function getRequestIdentity(request: Request): RequestIdentity | null {
  const email = request.headers.get("x-user-email")?.trim();
  const name = request.headers.get("x-user-name")?.trim();
  if (email) return { email: email.toLowerCase(), name: name || email };
  const hostname = new URL(request.url).hostname;
  const demoEnabled = process.env.DEMO_MODE === "true" || hostname === "localhost" || hostname === "127.0.0.1";
  if (demoEnabled) {
    return { email: "demo@trevil.local", name: "Usuário de demonstração" };
  }
  return null;
}

export function getRequestActor(request: Request) {
  return getRequestIdentity(request)?.name ?? null;
}
