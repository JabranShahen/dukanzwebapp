export class ProductCategory 
{
    public id: string;   
    public partitionKey: string;
    public productCategoryName: string;
    public productCategoryImageURL: string;
    public visible: boolean;
    public order: number;

    constructor(public obj : { id: string }) {
    }

}