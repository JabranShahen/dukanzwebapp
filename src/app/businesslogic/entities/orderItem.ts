import { Product } from "./product";

export class OrderItem {
    id: string;
    product: Product;
    quantity?: number;
    orderItemTotalPrice?: number;

    constructor(
        id: string,
        product: Product,
        quantity?: number,
        orderItemTotalPrice?: number
    ) {
        this.id = id;
        this.product = product;
        this.quantity = quantity;
        this.orderItemTotalPrice = orderItemTotalPrice;
    }
}
