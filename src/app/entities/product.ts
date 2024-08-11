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
  partitionKey: string; // Add this line
  
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
    partitionKey: string,  // Add this line in the constructor
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
    this.partitionKey = partitionKey;  // Set this.partitionKey
  }
}
