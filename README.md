# Trevil

SaaS full stack de operações para pequenos e-commerces. Centraliza pedidos, catálogo, clientes, estoque, indicadores e auditoria em uma interface responsiva.

**Aplicação em produção:** [Abrir Trevil](https://trevil.vercel.app)

![Central de pedidos do Trevil](public/screenshots/dashboard.jpg)

## Contexto do produto

A **Ateliê Norte** é a loja fictícia usada nos dados de exemplo. Ela vende pela loja própria, marketplace e social commerce. A rotina começa pelos pedidos que aguardam separação e pelos produtos abaixo do ponto de reposição; por isso esses itens aparecem primeiro no painel.

## Problema resolvido

Operações pequenas costumam separar pedidos, estoque e clientes em planilhas diferentes. Isso gera venda sem saldo, atualização manual, falta de rastreabilidade e decisões baseadas em números inconsistentes. O Trevil mantém esses fluxos em um único banco relacional e protege cada alteração com regras de negócio no servidor.

## Principais recursos

- Dashboard com receita, pedidos, ticket médio, canais e alertas.
- Workflow de pedidos: pago, preparação, envio, entrega e cancelamento.
- Reserva atômica de estoque e prevenção de venda acima do saldo disponível.
- Liberação da reserva no cancelamento e baixa física no envio.
- Catálogo com SKU único, preço, categoria, status e ponto de reposição.
- Clientes segmentados como novo, recorrente ou VIP.
- Ledger de reservas, liberações, vendas e reposições.
- Relatórios de 7, 30 e 90 dias calculados no servidor.
- Exportações CSV de pedidos, produtos, clientes e movimentações.
- RBAC com funções Administrador, Gestor e Leitor.
- Auditoria com usuário, horário e descrição de cada mudança.
- Interface responsiva, acessível e com atalho de busca `Ctrl/Cmd + K`.

## Arquitetura

```text
React/Next.js
    │
    ├── API Routes ── autenticação + autorização RBAC
    │       │
    │       ├── regras de pedidos e relatórios
    │       └── exportações CSV seguras
    │
    └── PostgreSQL
            ├── pedidos e itens
            ├── produtos e clientes
            ├── eventos e movimentações
            └── funções de usuário
```

As decisões técnicas e os fluxos completos estão em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

- React 19 e TypeScript
- Next.js App Router e Vercel Functions
- PostgreSQL e Drizzle ORM
- SQL relacional com índices, constraints e transações
- Lucide Icons e CSS responsivo
- Node Test Runner e ESLint

## Modelo de dados

| Tabela | Responsabilidade |
| --- | --- |
| `products` | Catálogo, preço, saldo, reservas e reposição |
| `customers` | Perfil, segmento, pedidos e receita acumulada |
| `orders` | Workflow, pagamento, canal e valor |
| `order_items` | Produtos e preços históricos do pedido |
| `order_events` | Trilha de auditoria do workflow |
| `stock_movements` | Ledger imutável do estoque |
| `user_roles` | Função persistente usada pelo RBAC |

## Regras de negócio importantes

1. Um item só entra no pedido quando existe saldo disponível.
2. A criação do pedido reserva o item na mesma transação.
3. Cancelar antes do envio devolve a reserva.
4. Enviar reduz estoque físico e reserva simultaneamente.
5. Estados finais não podem ser alterados.
6. Toda escrita exige identidade e permissão compatível.
7. Exportações neutralizam células que poderiam virar fórmulas.

## API

Os endpoints, payloads, respostas e permissões estão documentados em [docs/API.md](docs/API.md).

Principais grupos:

- `/api/dashboard` e `/api/reports`
- `/api/orders` e `/api/orders/:id`
- `/api/products` e `/api/products/:id`
- `/api/customers` e `/api/customers/:id`
- `/api/inventory`, `/api/exports` e `/api/health`

## Desenvolvimento local

Requisitos: Node.js 22.13 ou superior.

```bash
npm ci
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Comandos de qualidade:

```bash
npm run lint
npm test
npm run test:e2e
npm run typecheck
npm run build
npm run db:generate
```

## Qualidade e segurança

- 15 testes automatizados para workflow, analytics, RBAC e CSV.
- Jornada de navegador para criação de pedido e reserva de estoque.
- Build de produção validado para a Vercel.
- Operações de escrita protegidas no servidor.
- Prepared statements em todas as consultas com entrada dinâmica.
- CSV protegido contra formula injection.
- Health check com validação do banco.
- Error boundary e estados de carregamento/falha.

Mais detalhes em [docs/SECURITY.md](docs/SECURITY.md).

## Decisões e limitações

- A autenticação usa uma identidade encaminhada por um proxy confiável; o projeto não mantém senhas.
- O primeiro usuário autenticado inicializa a função de administrador. Usuários posteriores começam como leitores.
- O pedido de demonstração possui um item por criação para manter o fluxo objetivo; o modelo aceita vários itens.
- Integrações reais de pagamento e transportadora ficam fora do escopo desta versão.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Segurança](docs/SECURITY.md)
- [Decisões de produto e engenharia](docs/DECISIONS.md)
