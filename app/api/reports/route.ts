import { getDatabase } from "../../../db/runtime";
import { normalizeReportPeriod, percentageGrowth } from "../../../lib/analytics";
import { authorize } from "../../../lib/permissions";

export async function GET(request: Request) {
  const access = await authorize(request, "reports:view");
  if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
  const rawPeriod = Number(new URL(request.url).searchParams.get("period") ?? 30);
  const period = normalizeReportPeriod(rawPeriod);
  const currentStart = `-${period} days`;
  const previousStart = `-${period * 2} days`;
  const db = await getDatabase();
  const [summary, previous, trend, statuses, categories, customers, channels, inventory] = await db.batch([
    db.prepare(`SELECT COALESCE(SUM(CASE WHEN status!='canceled' THEN total_cents ELSE 0 END),0) AS revenueCents,
      SUM(CASE WHEN status!='canceled' THEN 1 ELSE 0 END) AS orderCount,
      ROUND(COALESCE(AVG(CASE WHEN status!='canceled' THEN total_cents END),0)) AS averageTicketCents,
      ROUND(100.0*SUM(CASE WHEN status='canceled' THEN 1 ELSE 0 END)/GREATEST(COUNT(*),1),1) AS cancellationRate,
      ROUND(100.0*SUM(CASE WHEN status IN ('shipped','delivered') THEN 1 ELSE 0 END)/GREATEST(SUM(CASE WHEN status!='canceled' THEN 1 ELSE 0 END),1),1) AS fulfillmentRate
      FROM orders WHERE created_at>=CURRENT_TIMESTAMP+(?::interval)`).bind(currentStart),
    db.prepare(`SELECT COALESCE(SUM(CASE WHEN status!='canceled' THEN total_cents ELSE 0 END),0) AS revenueCents,
      SUM(CASE WHEN status!='canceled' THEN 1 ELSE 0 END) AS orderCount
      FROM orders WHERE created_at>=CURRENT_TIMESTAMP+(?::interval) AND created_at<CURRENT_TIMESTAMP+(?::interval)`).bind(previousStart, currentStart),
    db.prepare(`SELECT date(created_at) AS day,SUM(CASE WHEN status!='canceled' THEN total_cents ELSE 0 END) AS revenueCents,
      SUM(CASE WHEN status!='canceled' THEN 1 ELSE 0 END) AS orders
      FROM orders WHERE created_at>=CURRENT_TIMESTAMP+(?::interval) GROUP BY date(created_at) ORDER BY day`).bind(currentStart),
    db.prepare(`SELECT status,COUNT(*) AS count,SUM(total_cents) AS revenueCents FROM orders
      WHERE created_at>=CURRENT_TIMESTAMP+(?::interval) GROUP BY status ORDER BY count DESC`).bind(currentStart),
    db.prepare(`SELECT p.category,SUM(oi.quantity) AS units,SUM(oi.quantity*oi.unit_price_cents) AS revenueCents
      FROM order_items oi JOIN products p ON p.id=oi.product_id JOIN orders o ON o.id=oi.order_id
      WHERE o.status!='canceled' AND o.created_at>=CURRENT_TIMESTAMP+(?::interval) GROUP BY p.category ORDER BY revenueCents DESC`).bind(currentStart),
    db.prepare(`SELECT c.name,c.segment,COUNT(o.id) AS orders,COALESCE(SUM(CASE WHEN o.status!='canceled' THEN o.total_cents ELSE 0 END),0) AS revenueCents
      FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.created_at>=CURRENT_TIMESTAMP+(?::interval)
      GROUP BY c.id ORDER BY revenueCents DESC LIMIT 5`).bind(currentStart),
    db.prepare(`SELECT channel,COUNT(*) AS orders,SUM(total_cents) AS revenueCents FROM orders
      WHERE status!='canceled' AND created_at>=CURRENT_TIMESTAMP+(?::interval) GROUP BY channel ORDER BY revenueCents DESC`).bind(currentStart),
    db.prepare(`SELECT SUM(stock*price_cents) AS stockValueCents,SUM(stock) AS physicalUnits,
      SUM(reserved_stock) AS reservedUnits,SUM(CASE WHEN status='active' AND stock-reserved_stock<=reorder_point THEN 1 ELSE 0 END) AS criticalProducts
      FROM products`),
  ]);
  const current = summary.results[0] as Record<string, number>;
  const prior = previous.results[0] as Record<string, number>;
  const growth = percentageGrowth(Number(current.revenueCents), Number(prior.revenueCents));
  return Response.json({
    period, summary: { ...current, revenueGrowth: growth },
    trend: trend.results, statuses: statuses.results, categories: categories.results,
    customers: customers.results, channels: channels.results, inventory: inventory.results[0],
  });
}
