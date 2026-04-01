export interface EventCategoryRecord {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId: string;
  productCategoryId: string;
  categoryName: string;
  imageURL?: string;
  visible: boolean;
  order: number;
}

export interface EventCategoryMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId?: string;
  productCategoryId: string;
  categoryName: string;
  imageURL?: string;
  imageFile?: File | null;
  clearImage?: boolean;
  visible: boolean;
  order: number;
}
