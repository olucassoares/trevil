import { ensureCommerceData } from "../../../db/init";
import { getDatabase } from "../../../db/runtime";

export async function GET() {
  try {
    await ensureCommerceData();
    const db = await getDatabase();
    await db.prepare("SELECT 1 AS ready").first();
    return Response.json({ status: "ok", service: "trevil", database: "ready", timestamp: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Health check error", error);
    return Response.json({ status: "error", service: "trevil", database: "unavailable" }, { status: 503 });
  }
}
