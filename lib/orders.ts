export const orderStatuses = ["pending", "paid", "processing", "shipped", "delivered", "canceled"] as const;
export type OrderStatus = typeof orderStatuses[number];

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "canceled"],
  paid: ["processing", "canceled"],
  processing: ["shipped", "canceled"],
  shipped: ["delivered"],
  delivered: [],
  canceled: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus);
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  return transitions[from].includes(to);
}

export function nextOrderStatuses(status: OrderStatus) {
  return transitions[status];
}
