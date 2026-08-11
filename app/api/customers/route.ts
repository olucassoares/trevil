import { ensureCommerceData } from "../../../db/init";
import { getDatabase } from "../../../db/runtime";
import { authorize } from "../../../lib/permissions";

export async function POST(request: Request) {
  const access = await authorize(request, "customers:write");
  if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
  try {
    await ensureCommerceData();
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const segment = String(body.segment ?? "new");
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !["new", "returning", "vip"].includes(segment)) {
      return Response.json({ error: "Revise os dados do cliente." }, { status: 400 });
    }
    const db = await getDatabase();
    if (await db.prepare("SELECT id FROM customers WHERE email=?").bind(email).first()) {
      return Response.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }
    const id = crypto.getRandomValues(new Uint32Array(1))[0];
    await db.prepare("INSERT INTO customers (id,name,email,segment) VALUES (?,?,?,?)").bind(id, name, email, segment).run();
    return Response.json({ id, message: "Cliente cadastrado." }, { status: 201 });
  } catch (error) {
    console.error("Create customer error", error);
    return Response.json({ error: "Não foi possível cadastrar o cliente." }, { status: 500 });
  }
}
