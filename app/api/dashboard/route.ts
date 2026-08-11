import { ensureCommerceData } from "../../../db/init";
import { getDatabase } from "../../../db/runtime";

export async function GET() {
  try {
    await ensureCommerceData();
    const db = await getDatabase();
    const [summary, orders, inventory, channels, trend, topProducts, customers, stockMovements] = await db.batch([
      db.prepare(`SELECT
        COALESCE(SUM(CASE WHEN status != 'canceled' THEN total_cents ELSE 0 END), 0) AS revenueCents,
        SUM(CASE WHEN status != 'canceled' THEN 1 ELSE 0 END) AS orderCount,
        ROUND(COALESCE(AVG(CASE WHEN status != 'canceled' THEN total_cents END), 0)) AS averageTicketCents,
        SUM(CASE WHEN date(created_at) = CURRENT_DATE AND status != 'canceled' THEN 1 ELSE 0 END) AS ordersToday
        FROM orders`),
      db.prepare(`SELECT o.id, o.number, o.customer_id AS customerId, o.status, o.payment_status AS paymentStatus,
        o.total_cents AS totalCents, o.channel, o.created_at AS createdAt,
        c.name AS customer, COUNT(oi.id) AS itemCount
        FROM orders o JOIN customers c ON c.id = o.customer_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id, c.name ORDER BY o.created_at DESC LIMIT 20`),
      db.prepare(`SELECT id, sku, name, category, stock, reserved_stock AS reservedStock,
        reorder_point AS reorderPoint, price_cents AS priceCents, status, created_at AS createdAt
        FROM products
        ORDER BY CASE WHEN status = 'active' AND stock - reserved_stock <= reorder_point THEN 0 ELSE 1 END, name ASC`),
      db.prepare(`SELECT channel, COUNT(*) AS orders, SUM(total_cents) AS revenueCents
        FROM orders WHERE status != 'canceled' GROUP BY channel ORDER BY revenueCents DESC`),
      db.prepare(`SELECT date(created_at) AS day, SUM(total_cents) AS revenueCents
        FROM orders WHERE status != 'canceled' AND created_at >= CURRENT_TIMESTAMP - INTERVAL '6 days'
        GROUP BY date(created_at) ORDER BY day ASC`),
      db.prepare(`SELECT p.name, p.sku, SUM(oi.quantity) AS units,
        SUM(oi.quantity * oi.unit_price_cents) AS revenueCents
        FROM order_items oi JOIN products p ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id WHERE o.status != 'canceled'
        GROUP BY p.id ORDER BY units DESC, revenueCents DESC LIMIT 4`),
      db.prepare(`SELECT id,name,email,segment,total_spent_cents AS totalSpentCents,order_count AS orderCount
        ,created_at AS createdAt FROM customers ORDER BY name ASC`),
      db.prepare(`SELECT sm.id, sm.product_id AS productId, sm.order_id AS orderId, sm.type,
        sm.quantity, sm.actor, sm.created_at AS createdAt, p.name AS product, p.sku,
        o.number AS orderNumber
        FROM stock_movements sm JOIN products p ON p.id = sm.product_id
        LEFT JOIN orders o ON o.id = sm.order_id
        ORDER BY sm.created_at DESC, sm.id DESC LIMIT 30`),
    ]);

    return Response.json({
      summary: summary.results[0], orders: orders.results, inventory: inventory.results,
      channels: channels.results, trend: trend.results, topProducts: topProducts.results,
      customers: customers.results, stockMovements: stockMovements.results,
    });
  } catch (error) {
    console.error("Commerce dashboard error", error);
    return Response.json({ error: "Não foi possível carregar a operação." }, { status: 500 });
  }
}
