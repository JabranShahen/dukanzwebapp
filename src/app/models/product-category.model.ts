export interface ProductCategory {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  productCategoryName: string;
  productCategoryImageURL?: string;
  visible: boolean;
  order: number;
}

export interface ProductCategoryMutation {
  id?: string;
  productCategoryName: string;
  productCategoryImageURL?: string;
  visible: boolean;
  order: number;
}
