import { expect, test } from "@playwright/test";

test("cria um pedido pelo fluxo operacional", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Pedidos/ }).click();
  await expect(page.getByRole("heading", { name: "Gestão de pedidos" })).toBeVisible();

  await page.getByRole("button", { name: "Novo pedido" }).click();
  await expect(page.getByRole("heading", { name: "Reservar venda" })).toBeVisible();
  await page.getByRole("combobox", { name: "Cliente" }).selectOption({ index: 1 });
  await page.getByRole("combobox", { name: "Produto" }).selectOption({ index: 1 });
  await page.getByRole("spinbutton", { name: "Quantidade" }).fill("1");
  await page.getByRole("button", { name: "Criar e reservar" }).click();

  await expect(page.getByText(/criado com estoque reservado/i)).toBeVisible();
});
