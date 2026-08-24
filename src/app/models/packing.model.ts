export interface PackingBatchSummary {
  id: string;
  purchaseDateKey: string;
  purchaseDate: string;
  deliveryDate: string;
  purchaseStatus: string;
  orderCount: number;
  readyOrderCount: number;
  blockedOrderCount: number;
  packedOrderCount: number;
}

export interface PackingOrderItem {
  productId: string;
  productName: string;
  unitName: string;
  quantity: number;
  purchaseStatus: string;
}

export interface PackingOrderSummary {
  orderId: string;
  orderStatus: string;
  packingState: 'Ready' | 'Blocked' | 'Packed' | 'Closed' | string;
  blockReason: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  grossTotal: number;
  itemCount: number;
  items: PackingOrderItem[];
}

export interface PackingBatchDetail {
  purchaseId: string;
  purchaseDateKey: string;
  purchaseDate: string;
  deliveryDate: string;
  purchaseStatus: string;
  orderCount: number;
  readyOrderCount: number;
  blockedOrderCount: number;
  packedOrderCount: number;
  orders: PackingOrderSummary[];
}

export interface MarkPackedRequest {
  orderIds: string[];
}

export interface SkippedOrder {
  orderId: string;
  reason: string;
}

export interface MarkPackedResult {
  updatedOrderIds: string[];
  skippedOrders: SkippedOrder[];
}
