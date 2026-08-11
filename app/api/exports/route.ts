import { getDatabase } from "../../../db/runtime";
import { toCsv } from "../../../lib/csv";
import { authorize } from "../../../lib/permissions";

const exportTypes = ["orders", "products", "customers", "movements"] as const;
type ExportType = typeof exportTypes[number];

export async function GET(request: Request) {
  const access = await authorize(request, "reports:export");
  if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
  const type = new URL(request.url).searchParams.get("type") as ExportType;
  if (!exportTypes.includes(type)) return Response.json({ error: "Exportação inválida." }, { status: 400 });
  const db = await getDatabase();
  let headers: string[] = [];
  let rows: unknown[][] = [];

  if (type === "orders") {
    headers = ["Pedido", "Cliente", "Status", "Pagamento", "Canal", "Total (centavos)", "Criado em"];
    const result = await db.prepare(`SELECT o.number,c.name,o.status,o.payment_status,o.channel,o.total_cents,o.created_at
      FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY o.created_at DESC`).all();
    rows = result.results.map((row) => Object.values(row));
  } else if (type === "products") {
    headers = ["SKU", "Produto", "Categoria", "Preço (centavos)", "Estoque físico", "Reservado", "Disponível", "Ponto de reposição", "Status"];
    const result = await db.prepare(`SELECT sku,name,category,price_cents,stock,reserved_stock,stock-reserved_stock AS available,reorder_point,status FROM products ORDER BY name`).all();
    rows = result.results.map((row) => Object.values(row));
  } else if (type === "customers") {
    headers = ["Nome", "E-mail", "Segmento", "Pedidos", "Receita (centavos)", "Criado em"];
    const result = await db.prepare("SELECT name,email,segment,order_count,total_spent_cents,created_at FROM customers ORDER BY name").all();
    rows = result.results.map((row) => Object.values(row));
  } else {
    headers = ["Produto", "SKU", "Tipo", "Quantidade", "Pedido", "Responsável", "Data"];
    const result = await db.prepare(`SELECT p.name,p.sku,sm.type,sm.quantity,COALESCE(o.number,''),sm.actor,sm.created_at
      FROM stock_movements sm JOIN products p ON p.id=sm.product_id LEFT JOIN orders o ON o.id=sm.order_id
      ORDER BY sm.created_at DESC,sm.id DESC`).all();
    rows = result.results.map((row) => Object.values(row));
  }

  return new Response(toCsv(headers, rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="trevil-${type}.csv"`,
      "cache-control": "no-store",
    },
  });
}
