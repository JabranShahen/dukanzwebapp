export class Product {
  id: string;
  productName: string;
  productDescription?: string;
  orignalPrice: number;
  currentPrice: number;
  currentCost: number;
  unitName: string;
  displayPercentage: number;
  displayUnitName?: string;
  imageURL: string;
  visible: boolean;
  order: number;
  productCategoryId?: string;

  constructor(
    id: string,
    productName: string,
    orignalPrice: number,
    currentPrice: number,
    currentCost: number,
    unitName: string,
    displayPercentage: number,
    imageURL: string,
    visible: boolean,
    order: number,
    productCategoryId?: string,
    productDescription?: string,
    displayUnitName?: string,
  ) {
    this.id = id;
    this.productName = productName;
    this.orignalPrice = orignalPrice;
    this.currentPrice = currentPrice;
    this.currentCost = currentCost;
    this.unitName = unitName;
    this.displayPercentage = displayPercentage;
    this.imageURL = imageURL;
    this.visible = visible;
    this.order = order;
    this.productCategoryId = productCategoryId;
    this.productDescription = productDescription;
    this.displayUnitName = displayUnitName;
  }
}
