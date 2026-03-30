export interface ProductCategoryReference {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  productCategoryName?: string;
}

export interface Product {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  productName: string;
  productDescription?: string;
  orignalPrice: number;
  currentPrice: number;
  currentCost: number;
  unitName: string;
  displayPercentage: number;
  displayUnitName?: string;
  imageURL?: string;
  visible: boolean;
  order: number;
  productCategoryId?: string;
  productCategory?: ProductCategoryReference | null;
}

export interface CreateProductRequest {
  id?: string;
  productName: string;
  productDescription?: string;
  orignalPrice: number;
  currentPrice: number;
  currentCost: number;
  unitName: string;
  displayPercentage: number;
  displayUnitName?: string;
  imageURL?: string;
  visible: boolean;
  order: number;
  productCategoryId: string;
  productCategoryName?: string;
}

export interface UpdateProductRequest {
  id: string;
  productName: string;
  productDescription?: string;
  orignalPrice: number;
  currentPrice: number;
  currentCost: number;
  unitName: string;
  displayPercentage: number;
  displayUnitName?: string;
  imageURL?: string;
  visible: boolean;
  order: number;
  productCategoryId: string;
  productCategoryName?: string;
}
