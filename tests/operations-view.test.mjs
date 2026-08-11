import assert from "node:assert/strict";
import test from "node:test";

import { summarizeOperation } from "../lib/operations-view.ts";

test("resume a fila operacional e ignora pedidos encerrados", () => {
  const result = summarizeOperation(
    [{ status: "processing" }, { status: "shipped" }, { status: "delivered" }, { status: "canceled" }],
    [{ name: "Boné", stock: 4, reservedStock: 2, reorderPoint: 3, status: "active" }],
  );
  assert.equal(result.activeOrderCount, 2);
  assert.equal(result.packingCount, 1);
  assert.equal(result.shippedCount, 1);
  assert.equal(result.lowStock[0].name, "Boné");
});

test("não alerta produtos arquivados ou acima do ponto de reposição", () => {
  const result = summarizeOperation([], [
    { name: "Arquivado", stock: 0, reservedStock: 0, reorderPoint: 5, status: "archived" },
    { name: "Saudável", stock: 10, reservedStock: 1, reorderPoint: 3, status: "active" },
  ]);
  assert.deepEqual(result.lowStock, []);
});
