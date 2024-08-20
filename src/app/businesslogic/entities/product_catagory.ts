export class ProductCategory {
    public id: string;
    public partitionKey: string;
    public productCategoryName: string;
    public productCategoryImageURL: string;
    public visible: boolean;
    public order: number;
  
    constructor(obj: {
      id: string;
      partitionKey: string;
      productCategoryName: string;
      productCategoryImageURL: string;
      visible: boolean;
      order: number;
    }) {
      this.id = obj.id;
      this.partitionKey = obj.partitionKey;
      this.productCategoryName = obj.productCategoryName;
      this.productCategoryImageURL = obj.productCategoryImageURL;
      this.visible = obj.visible;
      this.order = obj.order;
    }
  }