import { Box, ShoppingBag, Truck } from "lucide-react";

type OperationBriefProps = {
  packingCount: number;
  shippedCount: number;
  nextAction: string;
  hasStockAlert: boolean;
  onOpen: () => void;
};

export function OperationBrief({ packingCount, shippedCount, nextAction, hasStockAlert, onOpen }: OperationBriefProps) {
  return (
    <section className="operation-brief" aria-label="Resumo acionável do turno">
      <div><span><ShoppingBag size={15}/></span><p><small>SEPARAÇÃO</small><strong>{packingCount ? `${packingCount} na fila` : "Fila concluída"}</strong></p></div>
      <div><span><Truck size={15}/></span><p><small>EM TRANSPORTE</small><strong>{shippedCount} {shippedCount === 1 ? "pedido" : "pedidos"}</strong></p></div>
      <div className={hasStockAlert ? "brief-alert" : ""}><span><Box size={15}/></span><p><small>PRÓXIMA AÇÃO</small><strong>{nextAction}</strong></p></div>
      <button onClick={onOpen}>Abrir fila →</button>
    </section>
  );
}
