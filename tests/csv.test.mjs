import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, toCsv } from "../lib/csv.ts";

test("escapa aspas e separadores em células CSV", () => {
  assert.equal(csvCell('Produto, tamanho "M"'), '"Produto, tamanho ""M"""');
});

test("neutraliza fórmulas perigosas para planilhas", () => {
  assert.equal(csvCell("=HYPERLINK(\"x\")"), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell("-2+3"), '"\'-2+3"');
});

test("gera CSV com BOM e quebra de linha compatível", () => {
  const output = toCsv(["Nome", "Valor"], [["Camiseta", 8990]]);
  assert.ok(output.startsWith("\uFEFF"));
  assert.ok(output.includes("\r\n"));
});
