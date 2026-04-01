export interface EventProductRecord {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId: string;
  eventCategoryId: string;
  productId: string;
  productName?: string;
  productDescription?: string;
  imageURL?: string;
  overrideImageURL?: string;
  displayPercentage?: number;
  displayUnitName?: string;
  orignalPrice: number;
  currentPrice: number;
  currentCost: number;
  unitName?: string;
  visible: boolean;
  order?: number;
}

export interface EventProductMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventId?: string;
  eventCategoryId?: string;
  productId: string;
  productName?: string;
  productDescription?: string;
  imageURL?: string;
  overrideImageURL?: string;
  imageFile?: File | null;
  clearImage?: boolean;
  displayPercentage?: number;
  displayUnitName?: string;
  orignalPrice: number;
  currentPrice: number;
  currentCost: number;
  unitName?: string;
  visible: boolean;
  order?: number;
}
