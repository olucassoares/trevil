import { ensureCommerceData } from "../../../db/init";
import { getDatabase } from "../../../db/runtime";
import { authorize } from "../../../lib/permissions";

const channels = new Set(["store", "marketplace", "social"]);

export async function POST(request: Request) {
  try {
    const access = await authorize(request, "orders:write");
    if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
    const actor = access.actor;
    const body = await request.json() as Record<string, unknown>;
    const customerId = Number(body.customerId);
    const productId = Number(body.productId);
    const quantity = Number(body.quantity);
    const channel = String(body.channel || "");
    if (!Number.isInteger(customerId) || customerId < 1 || !Number.isInteger(productId) || productId < 1 ||
        !Number.isInteger(quantity) || quantity < 1 || quantity > 50 || !channels.has(channel)) {
      return Response.json({ error: "Os dados do pedido são inválidos." }, { status: 400 });
    }

    await ensureCommerceData();
    const db = await getDatabase();
    const [customer, product] = await Promise.all([
      db.prepare("SELECT id, name FROM customers WHERE id = ?").bind(customerId).first<{ id: number; name: string }>(),
      db.prepare("SELECT id, name, price_cents AS priceCents, stock - reserved_stock AS available FROM products WHERE id = ? AND status = 'active'").bind(productId).first<{ id: number; name: string; priceCents: number; available: number }>(),
    ]);
    if (!customer || !product) return Response.json({ error: "Cliente ou produto não encontrado." }, { status: 404 });
    if (Number(product.available) < quantity) return Response.json({ error: `Estoque insuficiente. Disponível: ${product.available}.` }, { status: 409 });

    const id = crypto.getRandomValues(new Uint32Array(1))[0] || Date.now();
    const number = `#COS-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const totalCents = Number(product.priceCents) * quantity;
    await db.batch([
      db.prepare("INSERT INTO orders (id,number,customer_id,status,payment_status,total_cents,channel) VALUES (?,?,?,'paid','paid',?,?)").bind(id, number, customerId, totalCents, channel),
      db.prepare("INSERT INTO order_items (order_id,product_id,quantity,unit_price_cents) VALUES (?,?,?,?)").bind(id, productId, quantity, product.priceCents),
      db.prepare("INSERT INTO stock_movements (product_id,order_id,type,quantity,actor) VALUES (?,?,'reserve',?,?)").bind(productId, id, quantity, actor),
      db.prepare("INSERT INTO order_events (order_id,action,from_status,to_status,actor,details) VALUES (?,'created',NULL,'paid',?,?)").bind(id, actor, `${quantity}x ${product.name}; estoque reservado`),
      db.prepare("UPDATE products SET reserved_stock = reserved_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(quantity, productId),
      db.prepare(`UPDATE customers SET total_spent_cents = total_spent_cents + ?, order_count = order_count + 1,
        segment = CASE WHEN order_count + 1 >= 5 THEN 'vip' WHEN order_count + 1 >= 2 THEN 'returning' ELSE segment END
        WHERE id = ?`).bind(totalCents, customerId),
    ]);
    return Response.json({ id, number }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("products_stock_bounds_check")) return Response.json({ error: "O estoque mudou durante a reserva. Atualize e tente novamente." }, { status: 409 });
    console.error("Create order error", error);
    return Response.json({ error: "Não foi possível criar o pedido." }, { status: 500 });
  }
}
