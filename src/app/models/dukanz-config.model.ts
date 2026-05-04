export interface DukanzConfig {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  message: string;
  deliveryCharges: number;
  minOrderSize: number;
  maxOrderSize: number;
  freeDeliveryOrderSize: number;
  cutoffTime: string;
  maxNumberOfActiveOrders: number;
  minOrderActiveScreenPresenseHours: number;
  maxNumberOfHistoryOrders: number;
  contactPhoneNumber: string;
  deliveryOffsetDays: number;
  latestAppVersion: string;
  minimumSupportedAppVersion: string;
  appUpgradePlayStoreUrl: string;
  forceAppUpgrade: boolean;
  areaId?: string | null;
}

export interface DukanzConfigMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  message: string;
  deliveryCharges: number;
  minOrderSize: number;
  maxOrderSize: number;
  freeDeliveryOrderSize: number;
  cutoffTime: string;
  maxNumberOfActiveOrders: number;
  minOrderActiveScreenPresenseHours: number;
  maxNumberOfHistoryOrders: number;
  contactPhoneNumber: string;
  deliveryOffsetDays: number;
  latestAppVersion: string;
  minimumSupportedAppVersion: string;
  appUpgradePlayStoreUrl: string;
  forceAppUpgrade: boolean;
  areaId?: string | null;
}
