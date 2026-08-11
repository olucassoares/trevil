type OrderLike = { status: string };
type ProductLike = { name: string; stock: number; reservedStock: number; reorderPoint: number; status: string };

export function summarizeOperation<TProduct extends ProductLike>(orders: OrderLike[], inventory: TProduct[]) {
  const lowStock = inventory.filter((product) => product.status === "active" && product.stock - product.reservedStock <= product.reorderPoint);
  return {
    activeOrderCount: orders.filter((order) => !["delivered", "canceled"].includes(order.status)).length,
    packingCount: orders.filter((order) => order.status === "processing").length,
    shippedCount: orders.filter((order) => order.status === "shipped").length,
    lowStock,
  };
}
