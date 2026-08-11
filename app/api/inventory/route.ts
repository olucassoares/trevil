import { ensureCommerceData } from "../../../db/init";
import { getDatabase } from "../../../db/runtime";
import { authorize } from "../../../lib/permissions";

export async function POST(request: Request) {
  const access = await authorize(request, "inventory:write");
  if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
  const actor = access.actor;
  try {
    await ensureCommerceData();
    const body = await request.json() as Record<string, unknown>;
    const productId = Number(body.productId);
    const quantity = Math.floor(Number(body.quantity));
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
      return Response.json({ error: "Informe uma quantidade válida." }, { status: 400 });
    }
    const db = await getDatabase();
    const product = await db.prepare("SELECT id,name FROM products WHERE id=? AND status='active'").bind(productId).first<{ id: number; name: string }>();
    if (!product) return Response.json({ error: "Produto não encontrado." }, { status: 404 });
    await db.batch([
      db.prepare("UPDATE products SET stock=stock+?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(quantity, productId),
      db.prepare("INSERT INTO stock_movements (product_id,order_id,type,quantity,actor) VALUES (?,NULL,'restock',?,?)").bind(productId, quantity, actor),
    ]);
    return Response.json({ ok: true, message: `${quantity} unidades adicionadas a ${product.name}.` });
  } catch (error) {
    console.error("Restock error", error);
    return Response.json({ error: "Não foi possível registrar a reposição." }, { status: 500 });
  }
}
