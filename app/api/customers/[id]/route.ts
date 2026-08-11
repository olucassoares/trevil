import { ensureCommerceData } from "../../../../db/init";
import { getDatabase } from "../../../../db/runtime";
import { authorize } from "../../../../lib/permissions";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await authorize(request, "customers:write");
  if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
  try {
    await ensureCommerceData();
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const segment = String(body.segment ?? "new");
    if (!Number.isInteger(id) || name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !["new", "returning", "vip"].includes(segment)) {
      return Response.json({ error: "Revise os dados do cliente." }, { status: 400 });
    }
    const db = await getDatabase();
    const result = await db.prepare("UPDATE customers SET name=?,email=?,segment=? WHERE id=?").bind(name, email, segment, id).run();
    if (!result.meta.changes) return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Update customer error", error);
    return Response.json({ error: "E-mail em uso ou dados inválidos." }, { status: 409 });
  }
}
