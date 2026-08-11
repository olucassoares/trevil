import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("declares the Trevil document metadata in the App Router", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  assert.match(layout, /<html\s+lang="pt-BR">/);
  assert.match(layout, /title:\s*"Trevil \| Operações de e-commerce"/);
  assert.match(layout, /description:\s*"A inteligência por trás da sua operação de e-commerce\."/);
  assert.match(layout, /icon:\s*"\/favicon\.svg"/);
});
