export type OrderStatus =
  | 'Approved'
  | 'Processing'
  | 'Dispatched'
  | 'Delivered'
  | 'Declined'
  | 'Cancelled'
  | 'Sending'
  | 'Canceling';

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['Approved', 'Processing', 'Dispatched'];
export const DONE_ORDER_STATUSES: OrderStatus[] = ['Delivered', 'Declined', 'Cancelled'];

export interface OrderStatusAction {
  label: string;
  nextStatus: OrderStatus;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export const STATUS_ACTIONS: Record<string, OrderStatusAction[]> = {
  Approved: [
    { label: 'Start Processing', nextStatus: 'Processing', variant: 'primary' },
    { label: 'Decline', nextStatus: 'Declined', variant: 'danger' }
  ],
  Processing: [
    { label: 'Dispatch', nextStatus: 'Dispatched', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'Cancelled', variant: 'danger' }
  ],
  Dispatched: [
    { label: 'Mark Delivered', nextStatus: 'Delivered', variant: 'primary' }
  ]
};

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
