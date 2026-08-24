export interface DukanzUser {
  id: string;
  PartitionKey?: string;
  name: string;
  address: string;
  phoneNumber: string;
  enable: boolean;
  isDriver: boolean;
  email?: string;
  areaId?: string | null;
  role?: 'operator' | 'superadmin' | string;
}

export interface UnallocatedCustomer {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  email?: string;
  pendingOrders: number;
}
