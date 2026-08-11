import { ensureCommerceData } from "../../../../db/init";
import { getDatabase } from "../../../../db/runtime";
import { canTransitionOrder, isOrderStatus, type OrderStatus } from "../../../../lib/orders";
import { authorize } from "../../../../lib/permissions";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Pedido inválido." }, { status: 400 });
    await ensureCommerceData();
    const db = await getDatabase();
    const [order, items, events] = await db.batch([
      db.prepare(`SELECT o.id,o.number,o.status,o.payment_status AS paymentStatus,o.total_cents AS totalCents,
        o.channel,o.created_at AS createdAt,c.name AS customer,c.email
        FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.id=?`).bind(id),
      db.prepare(`SELECT oi.id,oi.quantity,oi.unit_price_cents AS unitPriceCents,p.name,p.sku
        FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`).bind(id),
      db.prepare(`SELECT id,action,from_status AS fromStatus,to_status AS toStatus,actor,details,created_at AS createdAt
        FROM order_events WHERE order_id=? ORDER BY created_at DESC,id DESC`).bind(id),
    ]);
    if (!order.results[0]) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
    return Response.json({ order: order.results[0], items: items.results, events: events.results });
  } catch (error) {
    console.error("Order detail error", error);
    return Response.json({ error: "Não foi possível carregar o pedido." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize(request, "orders:write");
    if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
    const actor = access.actor;
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    const body = await request.json() as Record<string, unknown>;
    const target = String(body.status || "");
    if (!Number.isInteger(id) || id < 1 || !isOrderStatus(target)) return Response.json({ error: "Atualização inválida." }, { status: 400 });

    await ensureCommerceData();
    const db = await getDatabase();
    const order = await db.prepare("SELECT status FROM orders WHERE id=?").bind(id).first<{ status: OrderStatus }>();
    if (!order) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
    if (!canTransitionOrder(order.status, target)) return Response.json({ error: `Transição de ${order.status} para ${target} não permitida.` }, { status: 409 });
    const items = await db.prepare("SELECT product_id AS productId,quantity FROM order_items WHERE order_id=?").bind(id).all<{ productId: number; quantity: number }>();
    const statements = [
      db.prepare("UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status=?").bind(target, id, order.status),
      db.prepare("INSERT INTO order_events (order_id,action,from_status,to_status,actor,details) VALUES (?,'status_changed',?,?,?,?)")
        .bind(id, order.status, target, actor, `Pedido movido para ${target}`),
    ];

    for (const item of items.results) {
      if (target === "canceled") {
        statements.push(db.prepare("UPDATE products SET reserved_stock=GREATEST(reserved_stock-?,0),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(item.quantity, item.productId));
        statements.push(db.prepare("INSERT INTO stock_movements (product_id,order_id,type,quantity,actor) VALUES (?,?,'release',?,?)").bind(item.productId, id, item.quantity, actor));
      }
      if (target === "shipped") {
        statements.push(db.prepare("UPDATE products SET stock=stock-?,reserved_stock=GREATEST(reserved_stock-?,0),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(item.quantity, item.quantity, item.productId));
        statements.push(db.prepare("INSERT INTO stock_movements (product_id,order_id,type,quantity,actor) VALUES (?,?,'sale',?,?)").bind(item.productId, id, item.quantity, actor));
      }
    }
    await db.batch(statements);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Update order error", error);
    return Response.json({ error: "Não foi possível atualizar o pedido." }, { status: 500 });
  }
}
