import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission, rolePermissions } from "../lib/rbac.ts";

test("administrador possui todas as permissões", () => {
  assert.equal(rolePermissions.admin.length, 6);
  for (const permission of rolePermissions.admin) assert.equal(hasPermission("admin", permission), true);
});

test("gestor opera o sistema mas não exporta dados", () => {
  assert.equal(hasPermission("manager", "orders:write"), true);
  assert.equal(hasPermission("manager", "inventory:write"), true);
  assert.equal(hasPermission("manager", "reports:export"), false);
});

test("leitor não modifica dados", () => {
  assert.equal(hasPermission("viewer", "reports:view"), true);
  assert.equal(hasPermission("viewer", "orders:write"), false);
  assert.equal(hasPermission("viewer", "catalog:write"), false);
});
