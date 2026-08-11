import assert from "node:assert/strict";
import test from "node:test";

import { canTransitionOrder, isOrderStatus, nextOrderStatuses } from "../lib/orders.ts";

test("aceita apenas estados conhecidos", () => {
  assert.equal(isOrderStatus("processing"), true);
  assert.equal(isOrderStatus("unknown"), false);
});

test("mantém o fluxo normal do pedido", () => {
  assert.equal(canTransitionOrder("pending", "paid"), true);
  assert.equal(canTransitionOrder("paid", "processing"), true);
  assert.equal(canTransitionOrder("processing", "shipped"), true);
  assert.equal(canTransitionOrder("shipped", "delivered"), true);
});

test("recusa saltos e mudanças após estados finais", () => {
  assert.equal(canTransitionOrder("paid", "delivered"), false);
  assert.equal(canTransitionOrder("delivered", "canceled"), false);
  assert.deepEqual(nextOrderStatuses("canceled"), []);
});

test("permite cancelamento somente antes do envio", () => {
  assert.equal(canTransitionOrder("pending", "canceled"), true);
  assert.equal(canTransitionOrder("processing", "canceled"), true);
  assert.equal(canTransitionOrder("shipped", "canceled"), false);
});
