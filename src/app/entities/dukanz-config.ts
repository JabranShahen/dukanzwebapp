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
  latestAppVersion: string;
  minimumSupportedAppVersion: string;
  appUpgradePlayStoreUrl: string;
  forceAppUpgrade: boolean;
}

export interface CreateDukanzConfigRequest {
  id?: string;
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
  latestAppVersion: string;
  minimumSupportedAppVersion: string;
  appUpgradePlayStoreUrl: string;
  forceAppUpgrade: boolean;
}

export interface UpdateDukanzConfigRequest {
  id: string;
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
  latestAppVersion: string;
  minimumSupportedAppVersion: string;
  appUpgradePlayStoreUrl: string;
  forceAppUpgrade: boolean;
}
