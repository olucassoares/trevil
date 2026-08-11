# Arquitetura do Trevil

## Visão geral

O Trevil usa uma arquitetura full stack orientada a domínio. A interface React consome rotas HTTP executadas em Vercel Functions. As rotas concentram autenticação, autorização, validação e regras de negócio antes de acessar o PostgreSQL.

## Camadas

### Interface

`app/page.tsx` organiza os módulos Visão Geral, Pedidos, Produtos, Clientes, Estoque, Relatórios e Configurações. Os dados permanentes nunca usam `localStorage`; toda mutação retorna ao servidor e recarrega o estado consolidado.

### API

As rotas em `app/api` expõem recursos específicos. As operações de escrita verificam uma permissão RBAC antes de validar o payload. Respostas usam códigos HTTP coerentes: `400` para entrada inválida, `401` para ausência de identidade, `403` para função insuficiente, `404` para recurso inexistente e `409` para conflito de negócio.

### Domínio

- `lib/orders.ts`: máquina de estados do pedido.
- `lib/rbac.ts`: funções e permissões sem dependência de infraestrutura.
- `lib/analytics.ts`: períodos e comparação de receita.
- `lib/csv.ts`: serialização e proteção das exportações.
- `lib/security.ts`: identidade autenticada do ambiente.

### Persistência

`db/schema.ts` mantém o modelo Drizzle e `db/init.ts` garante tabelas, índices, constraints e dados iniciais. Migrações versionadas ficam em `drizzle/`.

## Fluxo de um pedido

1. A API valida identidade, permissão, cliente, produto, quantidade e canal.
2. O servidor verifica o saldo disponível antes de inserir o item.
3. A transação incrementa `reserved_stock`, e uma constraint impede reservas acima do estoque.
4. A API registra o movimento `reserve` e o evento `created`.
5. O envio reduz saldo físico e reserva; o cancelamento libera a reserva.
6. Cada transição cria um evento atribuído ao usuário.

## Consistência

- Prepared statements evitam interpolação de entrada em SQL.
- Uma transação PostgreSQL agrupa alterações relacionadas.
- Índices atendem status, datas e relacionamentos mais consultados.
- Constraints mantêm a regra crítica de estoque junto ao dado.
- O ledger permite reconstruir a origem das alterações de estoque.

## Observabilidade

`GET /api/health` inicializa a estrutura, consulta o banco e retorna `200` quando o serviço está pronto ou `503` quando a persistência não responde.
