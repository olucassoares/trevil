import { ensureCommerceData } from "../../../db/init";
import { getDatabase } from "../../../db/runtime";
import { authorize } from "../../../lib/permissions";

export async function POST(request: Request) {
  const access = await authorize(request, "catalog:write");
  if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
  const actor = access.actor;

  try {
    await ensureCommerceData();
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const sku = String(body.sku ?? "").trim().toUpperCase();
    const category = String(body.category ?? "").trim();
    const priceCents = Math.round(Number(body.priceCents));
    const stock = Math.floor(Number(body.stock));
    const reorderPoint = Math.floor(Number(body.reorderPoint));
    if (name.length < 2 || !/^[A-Z0-9-]{3,24}$/.test(sku) || category.length < 2 || priceCents < 1 || stock < 0 || reorderPoint < 0) {
      return Response.json({ error: "Revise os dados do produto." }, { status: 400 });
    }

    const db = await getDatabase();
    const existing = await db.prepare("SELECT id FROM products WHERE sku = ?").bind(sku).first();
    if (existing) return Response.json({ error: "Este SKU já está cadastrado." }, { status: 409 });
    const id = crypto.getRandomValues(new Uint32Array(1))[0];
    const statements = [
      db.prepare(`INSERT INTO products (id,sku,name,category,price_cents,stock,reserved_stock,reorder_point,status)
        VALUES (?,?,?,?,?,?,0,?,'active')`).bind(id, sku, name, category, priceCents, stock, reorderPoint),
    ];
    if (stock > 0) statements.push(db.prepare(`INSERT INTO stock_movements
      (product_id,order_id,type,quantity,actor) VALUES (?,NULL,'restock',?,?)`).bind(id, stock, actor));
    await db.batch(statements);
    return Response.json({ id, sku, message: "Produto cadastrado." }, { status: 201 });
  } catch (error) {
    console.error("Create product error", error);
    return Response.json({ error: "Não foi possível cadastrar o produto." }, { status: 500 });
  }
}
