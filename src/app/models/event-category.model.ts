export interface EventCategoryRecord {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId: string;
  productCategoryId: string;
  visible: boolean;
  order: number;
}

export interface EventCategoryMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId?: string;
  productCategoryId: string;
  visible: boolean;
  order: number;
}
