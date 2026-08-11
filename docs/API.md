# API do Trevil

Todas as respostas são JSON, exceto as exportações CSV. Operações protegidas dependem da identidade encaminhada pelo ambiente.

## Leitura

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/health` | Verifica serviço e banco |
| GET | `/api/dashboard` | Retorna resumo operacional completo |
| GET | `/api/session` | Retorna usuário, função e permissões |
| GET | `/api/orders/:id` | Retorna pedido, itens e eventos |
| GET | `/api/reports?period=30` | Calcula relatórios para 7, 30 ou 90 dias |
| GET | `/api/exports?type=orders` | Exporta `orders`, `products`, `customers` ou `movements` |

## Pedidos

### `POST /api/orders`

Permissão: `orders:write`.

```json
{
  "customerId": 1,
  "productId": 4,
  "quantity": 2,
  "channel": "store"
}
```

Cria um pedido pago, reserva estoque e registra auditoria. Retorna `409` quando o saldo não é suficiente.

### `PATCH /api/orders/:id`

Permissão: `orders:write`.

```json
{ "status": "processing" }
```

Aceita somente transições previstas pela máquina de estados.

## Produtos

### `POST /api/products`

Permissão: `catalog:write`.

```json
{
  "name": "Camiseta Essential",
  "sku": "CAM-ESS-001",
  "category": "Vestuário",
  "priceCents": 8990,
  "stock": 20,
  "reorderPoint": 5
}
```

### `PATCH /api/products/:id`

Permissão: `catalog:write`. Atualiza nome, categoria, preço, ponto de reposição e status.

## Clientes

### `POST /api/customers`

Permissão: `customers:write`.

```json
{
  "name": "Ana Martins",
  "email": "ana@example.com",
  "segment": "new"
}
```

### `PATCH /api/customers/:id`

Permissão: `customers:write`. Atualiza nome, e-mail e segmento.

## Estoque

### `POST /api/inventory`

Permissão: `inventory:write`.

```json
{ "productId": 4, "quantity": 10 }
```

Adiciona saldo físico e registra um movimento `restock` com o usuário responsável.

## Relatórios e exportações

`GET /api/reports` exige `reports:view`. O período inválido volta para 30 dias.

`GET /api/exports` exige `reports:export`. O retorno possui `Content-Type: text/csv`, BOM UTF-8, nome de arquivo e `Cache-Control: no-store`.
