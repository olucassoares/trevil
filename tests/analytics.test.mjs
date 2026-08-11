import test from "node:test";
import assert from "node:assert/strict";
import { normalizeReportPeriod, percentageGrowth } from "../lib/analytics.ts";

test("aceita somente períodos suportados", () => {
  assert.equal(normalizeReportPeriod(7), 7);
  assert.equal(normalizeReportPeriod(90), 90);
  assert.equal(normalizeReportPeriod(365), 30);
});

test("calcula crescimento e queda com uma casa decimal", () => {
  assert.equal(percentageGrowth(150, 100), 50);
  assert.equal(percentageGrowth(75, 100), -25);
  assert.equal(percentageGrowth(0, 0), 0);
});

test("trata início sem histórico anterior", () => {
  assert.equal(percentageGrowth(100, 0), 100);
});
