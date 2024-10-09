import { OrderFeedback } from "./orderFeedback";
import { OrderItem } from "./orderItem";
import { UserAccount } from "./userAccount";

export class Order {
    id: string;
    orderItems: OrderItem[];
    orderTotalPrice: number;
    deliveryChargeApplied: number;
    orderGrossPrice: number;
    deviceID: string;
    status: string;
    freeDeliveryOrderSize: number;
    deliveryChargesApplicible: number;
    maxOrderSize: number;
    orderDeviceDttm: Date;
    user?: UserAccount;
    driver?: UserAccount;
    orderFeedback?: OrderFeedback;

    constructor(
        id: string,
        orderItems: OrderItem[],
        orderTotalPrice: number,
        deliveryChargeApplied: number,
        orderGrossPrice: number,
        deviceID: string,
        status: string,
        freeDeliveryOrderSize: number,
        deliveryChargesApplicible: number,
        maxOrderSize: number,
        orderDeviceDttm: Date,
        user?: UserAccount,
        driver?: UserAccount,
        orderFeedback?: OrderFeedback
    ) {
        this.id = id;
        this.orderItems = orderItems;
        this.orderTotalPrice = orderTotalPrice;
        this.deliveryChargeApplied = deliveryChargeApplied;
        this.orderGrossPrice = orderGrossPrice;
        this.deviceID = deviceID;
        this.status = status;
        this.freeDeliveryOrderSize = freeDeliveryOrderSize;
        this.deliveryChargesApplicible = deliveryChargesApplicible;
        this.maxOrderSize = maxOrderSize;
        this.orderDeviceDttm = orderDeviceDttm;
        this.user = user;
        this.driver = driver;
        this.orderFeedback = orderFeedback;
    }
}
