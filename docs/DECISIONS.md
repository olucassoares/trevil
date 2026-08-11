# Decisões de produto e engenharia — Trevil

## 1. Estoque físico e reservado são saldos diferentes

Um pedido pago reserva unidades, mas elas só deixam o estoque físico quando o pedido é enviado. Essa separação permite cancelar antes do envio e devolver a reserva sem inventar uma reposição.

## 2. A disponibilidade é protegida no banco

A regra não depende do botão ou do estado da interface. A criação do item e a reserva acontecem juntas, impedindo que duas requisições vendam a mesma última unidade.

## 3. O pedido tem transições permitidas

O workflow limita quais estados podem seguir o atual. Pedidos entregues e cancelados são terminais, e cada mudança gera um evento com ator e horário.

## 4. Permissão é verificada por operação

Administrador, Gestor e Leitor têm capacidades diferentes. A API verifica a função antes de qualquer escrita ou exportação; esconder um botão não seria uma barreira de segurança.

## 5. Integrações externas ficaram fora

Pagamento, frete, fiscal e marketplace exigiriam credenciais e tratamento de falhas de terceiros. Esta versão foca a consistência do núcleo operacional e usa canais registrados no próprio pedido.
