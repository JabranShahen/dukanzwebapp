export interface EventCategoryRecord {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId: string;
  productCategoryId: string;
  overrideImageURL?: string;
  visible: boolean;
  order: number;
}

export interface EventCategoryMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId?: string;
  productCategoryId: string;
  overrideImageURL?: string;
  imageFile?: File | null;
  clearImage?: boolean;
  visible: boolean;
  order: number;
}
