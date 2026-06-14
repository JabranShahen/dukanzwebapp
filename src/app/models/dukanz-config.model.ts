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
  claimsEnabled: boolean;
  claimsPilotAreaIds: string[];
  claimWindowDays: number;
  claimsRequirePhotos: boolean;
  claimsMaxPhotos: number;
  claimsMaxPhotoSizeMb: number;
  claimsStorageContainer: string;
  claimsAttachmentRetentionDays: number;
  claimsDocumentRetentionDays: number;
  areaId?: string | null;
}

export interface ConfigContext {
  effectiveConfig: DukanzConfig | null;
  areaConfig:      DukanzConfig | null;
  globalConfig:    DukanzConfig | null;
}

export type ConfigField = keyof Omit<DukanzConfig, 'id' | 'PartitionKey' | 'partitionKey' | 'areaId'>;

export const CONFIG_FIELDS: ConfigField[] = [
  'message', 'contactPhoneNumber', 'cutoffTime', 'deliveryOffsetDays',
  'deliveryCharges', 'minOrderSize', 'maxOrderSize', 'freeDeliveryOrderSize',
  'maxNumberOfActiveOrders', 'minOrderActiveScreenPresenseHours', 'maxNumberOfHistoryOrders',
  'latestAppVersion', 'minimumSupportedAppVersion', 'appUpgradePlayStoreUrl', 'forceAppUpgrade',
  'claimsEnabled', 'claimWindowDays', 'claimsRequirePhotos', 'claimsMaxPhotos', 'claimsMaxPhotoSizeMb',
  'claimsStorageContainer', 'claimsAttachmentRetentionDays', 'claimsDocumentRetentionDays'
];

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
  claimsEnabled: boolean;
  claimsPilotAreaIds: string[];
  claimWindowDays: number;
  claimsRequirePhotos: boolean;
  claimsMaxPhotos: number;
  claimsMaxPhotoSizeMb: number;
  claimsStorageContainer: string;
  claimsAttachmentRetentionDays: number;
  claimsDocumentRetentionDays: number;
  areaId?: string | null;
}
