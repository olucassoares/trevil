import { ensureCommerceData } from "../../../../db/init";
import { getDatabase } from "../../../../db/runtime";
import { authorize } from "../../../../lib/permissions";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await authorize(request, "catalog:write");
  if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
  try {
    await ensureCommerceData();
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "").trim();
    const priceCents = Math.round(Number(body.priceCents));
    const reorderPoint = Math.floor(Number(body.reorderPoint));
    const status = String(body.status ?? "active");
    if (!Number.isInteger(id) || name.length < 2 || category.length < 2 || priceCents < 1 || reorderPoint < 0 || !["active", "archived"].includes(status)) {
      return Response.json({ error: "Revise os dados do produto." }, { status: 400 });
    }
    const db = await getDatabase();
    const result = await db.prepare(`UPDATE products SET name=?,category=?,price_cents=?,reorder_point=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .bind(name, category, priceCents, reorderPoint, status, id).run();
    if (!result.meta.changes) return Response.json({ error: "Produto não encontrado." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Update product error", error);
    return Response.json({ error: "Não foi possível atualizar o produto." }, { status: 500 });
  }
}
