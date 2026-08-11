import { ensureCommerceData } from "../db/init";
import { getDatabase } from "../db/runtime";
import { getRequestIdentity } from "./security";
import { hasPermission, rolePermissions, type Permission, type Role } from "./rbac";

export async function getUserAccess(request: Request) {
  const identity = getRequestIdentity(request);
  if (!identity) return null;
  await ensureCommerceData();
  const db = await getDatabase();
  let user = await db.prepare("SELECT email,name,role FROM user_roles WHERE email=?").bind(identity.email).first<{ email: string; name: string; role: Role }>();
  if (!user) {
    const count = await db.prepare("SELECT COUNT(*) AS count FROM user_roles").first<{ count: number }>();
    const role: Role = Number(count?.count ?? 0) === 0 ? "admin" : "viewer";
    await db.prepare("INSERT INTO user_roles (email,name,role) VALUES (?,?,?)").bind(identity.email, identity.name, role).run();
    user = { ...identity, role };
  }
  return { ...user, permissions: rolePermissions[user.role] };
}

export async function authorize(request: Request, permission: Permission) {
  const user = await getUserAccess(request);
  if (!user) return { allowed: false as const, status: 401, error: "Autenticação necessária." };
  if (!hasPermission(user.role, permission)) return { allowed: false as const, status: 403, error: "Sua função não permite esta operação." };
  return { allowed: true as const, user, actor: user.name };
}
