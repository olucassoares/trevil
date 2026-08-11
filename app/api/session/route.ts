import { getUserAccess } from "../../../lib/permissions";

export async function GET(request: Request) {
  const user = await getUserAccess(request);
  if (!user) return Response.json({ error: "Autenticação necessária." }, { status: 401 });
  return Response.json(user);
}
