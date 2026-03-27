export const SHIPPING_FEE = 10;

export const calculateShippingCost = (totalItems: number) => (
  totalItems > 0 ? SHIPPING_FEE : 0
);

export const calculateOrderTotal = (subtotal: number, totalItems: number) => (
  subtotal + calculateShippingCost(totalItems)
);
