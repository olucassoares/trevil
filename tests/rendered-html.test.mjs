import assert from "node:assert/strict";
import test from "node:test";

test("renders the Trevil document metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<html[^>]*\blang=["']pt-BR["']/i);
  assert.match(html, /<title>Trevil \| Operações de e-commerce<\/title>/i);
  assert.match(
    html,
    /<meta[^>]*\bname=["']description["'][^>]*\bcontent=["']A inteligência por trás da sua operação de e-commerce\.["'][^>]*>/i,
  );
  assert.match(html, /<link[^>]*\brel=["']icon["'][^>]*\bhref=["'][^"']*favicon\.svg["'][^>]*>/i);
});
