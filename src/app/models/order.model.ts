export type OrderStatus =
  | 'Approved'
  | 'Processing'
  | 'Dispatched'
  | 'Delivered'
  | 'Declined'
  | 'Cancelled'
  | 'Sending'
  | 'Canceling';

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['Sending', 'Approved', 'Processing', 'Dispatched', 'Canceling'];
export const DONE_ORDER_STATUSES: OrderStatus[] = ['Delivered', 'Declined', 'Cancelled'];

export interface OrderStatusAction {
  label: string;
  nextStatus: OrderStatus;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export const STATUS_ACTIONS: Record<string, OrderStatusAction[]> = {
  // Customer submitted — driver starts or declines
  Sending: [
    { label: 'Start Processing', nextStatus: 'Processing', variant: 'primary' },
    { label: 'Decline', nextStatus: 'Declined', variant: 'danger' }
  ],
  Approved: [
    { label: 'Start Processing', nextStatus: 'Processing', variant: 'primary' },
    { label: 'Decline', nextStatus: 'Declined', variant: 'danger' }
  ],
  Processing: [
    { label: 'Dispatch', nextStatus: 'Dispatched', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'Cancelled', variant: 'danger' }
  ],
  Dispatched: [
    { label: 'Mark Delivered', nextStatus: 'Delivered', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'Cancelled', variant: 'danger' }
  ],
  // Customer requested cancellation — driver confirms or continues
  Canceling: [
    { label: 'Confirm Cancel', nextStatus: 'Cancelled', variant: 'danger' },
    { label: 'Continue Processing', nextStatus: 'Processing', variant: 'secondary' }
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
