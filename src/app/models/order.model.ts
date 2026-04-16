export type OrderStatus =
  | 'Approved'
  | 'Packed'
  | 'Dispatched'
  | 'Delivered'
  | 'Declined'
  | 'Cancelled';

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['Approved', 'Packed', 'Dispatched'];
export const DONE_ORDER_STATUSES: OrderStatus[] = ['Delivered', 'Declined', 'Cancelled'];

export interface OrderStatusAction {
  label: string;
  nextStatus: OrderStatus;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export const STATUS_ACTIONS: Record<string, OrderStatusAction[]> = {
  Approved: [
    { label: 'Decline', nextStatus: 'Declined', variant: 'danger' }
  ],
  Packed: [
    { label: 'Dispatch', nextStatus: 'Dispatched', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'Cancelled', variant: 'danger' }
  ],
  Dispatched: [
    { label: 'Mark Delivered', nextStatus: 'Delivered', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'Cancelled', variant: 'danger' }
  ]
};

const LEGACY_PACKED_STATUSES = new Set(['Packed', 'Processing']);

export function normalizeOrderStatus(status: string | null | undefined): OrderStatus | string {
  const normalizedStatus = (status ?? '').trim();
  if (LEGACY_PACKED_STATUSES.has(normalizedStatus)) {
    return 'Packed';
  }

  return normalizedStatus;
}

export function isPackedStatus(status: string | null | undefined): boolean {
  return normalizeOrderStatus(status) === 'Packed';
}

export function isActiveOrderStatus(status: string | null | undefined): boolean {
  return ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(status) as OrderStatus);
}

export function getStatusActions(status: string | null | undefined): OrderStatusAction[] {
  return STATUS_ACTIONS[normalizeOrderStatus(status)] ?? [];
}

export interface OrderUser {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  name: string;
  address: string;
  phoneNumber: string;
  isDriver?: boolean;
}

export interface OrderItem {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  product: {
    id: string;
    productName: string;
    unitName?: string;
  };
  quantity: number;
  orderItemTotalPrice: number;
}

export interface Order {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  status: string;
  orderTotalPrice: number;
  deliveryChargeApplied: number;
  orderGrossPrice: number;
  orderDeviceDttm: string;
  deviceID?: string;
  freeDeliveryOrderSize?: number;
  deliveryChargesApplicible?: number;
  maxOrderSize?: number;
  user?: OrderUser | null;
  driver?: OrderUser | null;
  orderItems?: OrderItem[];
}
