export interface EventProductRecord {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId: string;
  eventCategoryId: string;
  productId: string;
  visible: boolean;
  order: number;
}

export interface EventProductMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId?: string;
  eventCategoryId?: string;
  productId: string;
  visible: boolean;
  order: number;
}
