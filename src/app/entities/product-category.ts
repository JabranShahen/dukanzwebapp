export interface ProductCategory {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  productCategoryName: string;
  productCategoryImageURL?: string;
  visible: boolean;
  order: number;
}

export interface CreateProductCategoryRequest {
  id?: string;
  productCategoryName: string;
  productCategoryImageURL?: string;
  visible: boolean;
  order: number;
}

export interface UpdateProductCategoryRequest {
  id: string;
  productCategoryName: string;
  productCategoryImageURL?: string;
  visible: boolean;
  order: number;
}
