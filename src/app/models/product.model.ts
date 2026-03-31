import { ProductCategory } from './product-category.model';

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
  displayPercentage?: number;
  displayUnitName?: string;
  imageURL?: string;
  visible: boolean;
  productCategory: ProductCategory;
  order?: number;
}

export interface ProductMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  productName: string;
  productDescription?: string;
  orignalPrice: number;
  currentPrice: number;
  currentCost: number;
  unitName: string;
  displayPercentage?: number;
  displayUnitName?: string;
  imageURL?: string;
  imageFile?: File | null;
  clearImage?: boolean;
  visible: boolean;
  productCategory?: ProductCategory | null;
  order?: number;
}

export function createEmptyProductCategory(): ProductCategory {
  return {
    id: '',
    PartitionKey: '',
    partitionKey: '',
    productCategoryName: '',
    productCategoryImageURL: '',
    visible: true,
    order: 0
  };
}
