export interface PurchasePreviewItem {
  productId: string;
  productName: string;
  unitName: string;
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
}

export interface PurchasePreviewCategory {
  categoryName: string;
  items: PurchasePreviewItem[];
}

export interface PurchaseSummary {
  id: string;
  purchDate: string;
  status: string;
  total: number;
  itemCount: number;
}

export interface PurchaseDetailItem {
  id: string;
  productId: string;
  productName: string;
  unitName: string;
  categoryName: string;
  quantity: number;
  pricePerQty: number;
  totalPrice: number;
  status: string;
}

export interface PurchaseDetail {
  id: string;
  purchDate: string;
  status: string;
  total: number;
  items: PurchaseDetailItem[];
}

export interface ProcessItemPayload {
  id: string;
  pricePerQty: number;
}

export interface PurchasePreview {
  windowStart: string;
  windowEnd: string;
  windowClosed: boolean;
  purchaseDateKey: string;
  deliveryDate: string;
  orderCount: number;
  alreadyCreated: boolean;
  categories: PurchasePreviewCategory[];
}
