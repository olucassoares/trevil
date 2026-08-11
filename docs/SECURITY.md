# Segurança

## Identidade

O Trevil não armazena senhas. Em produção comercial, a identidade deve vir de um provedor autenticado e o e-mail funciona como identificador estável. A versão pública de portfólio pode ser executada com `DEMO_MODE=true`, usando uma conta demonstrativa sem dados pessoais.

## Autorização

O RBAC é aplicado no servidor:

| Capacidade | Administrador | Gestor | Leitor |
| --- | --- | --- | --- |
| Pedidos | Sim | Sim | Não |
| Catálogo | Sim | Sim | Não |
| Clientes | Sim | Sim | Não |
| Estoque | Sim | Sim | Não |
| Relatórios | Sim | Sim | Sim |
| Exportações | Sim | Não | Não |

Esconder controles na interface não é considerado autorização. Cada rota sensível chama `authorize` antes de alterar ou exportar dados.

## Banco e entrada

- Consultas dinâmicas usam prepared statements.
- IDs, quantidades, estados, canais e segmentos passam por listas ou limites explícitos.
- SKU e e-mail são normalizados antes da gravação.
- A reserva crítica acontece em transação e é protegida por constraint no PostgreSQL.
- Eventos e movimentos registram o ator autenticado.

## Exportações

Valores iniciados por `=`, `+`, `-` ou `@` recebem um prefixo seguro antes da serialização. Aspas são duplicadas e todas as células são delimitadas. Isso reduz o risco de formula injection quando o CSV é aberto em uma planilha.

## Recomendações antes de produção comercial

- Definir administradores por configuração controlada, sem bootstrap do primeiro usuário.
- Adicionar rate limiting e limites por organização.
- Integrar logs estruturados e alertas de falha.
- Revisar retenção de dados e requisitos de privacidade.
- Executar testes de concorrência com carga realista.
