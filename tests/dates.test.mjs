import assert from "node:assert/strict";
import test from "node:test";
import { formatStoredDate, parseStoredDate } from "../lib/dates.mjs";

test("preserva timestamps ISO que já possuem fuso horário", () => {
  const parsed = parseStoredDate("2026-08-11T14:32:24.484Z");
  assert.equal(parsed?.toISOString(), "2026-08-11T14:32:24.484Z");
});

test("normaliza timestamps do banco sem fuso horário", () => {
  const parsed = parseStoredDate("2026-08-11 14:32:24.484");
  assert.equal(parsed?.toISOString(), "2026-08-11T14:32:24.484Z");
});

test("usa um texto seguro quando a data é inválida", () => {
  const formatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
  assert.equal(formatStoredDate("data-inválida", formatter), "Data indisponível");
});
