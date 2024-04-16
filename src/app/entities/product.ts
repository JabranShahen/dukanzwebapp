export class Product {
  // Properties
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

  // Constructor
  constructor(
    id: string,
    productName: string,
    productDescription: string | undefined,
    orignalPrice: number,
    currentPrice: number,
    currentCost: number,
    unitName: string,
    displayPercentage: number,
    displayUnitName: string | undefined,
    imageURL: string,
    visible: boolean,
    order: number,
    productCategoryId: string | undefined,
  ) {
    this.id = id;
    this.productName = productName;
    this.productDescription = productDescription;
    this.orignalPrice = orignalPrice;
    this.currentPrice = currentPrice;
    this.currentCost = currentCost;
    this.unitName = unitName;
    this.displayPercentage = displayPercentage;
    this.displayUnitName = displayUnitName;
    this.imageURL = imageURL;
    this.visible = visible;
    this.order = order;
    this.productCategoryId = productCategoryId;
  }
}
