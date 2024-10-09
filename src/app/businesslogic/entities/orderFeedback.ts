export class OrderFeedback {
    id: string;
    orderId: string;
    feedbackDtTm: Date;
    feedbackScore?: number;
    feedbackComment?: string;

    constructor(
        id: string,
        orderId: string,
        feedbackDtTm: Date,
        feedbackScore?: number,
        feedbackComment?: string
    ) {
        this.id = id;
        this.orderId = orderId;
        this.feedbackDtTm = feedbackDtTm;
        this.feedbackScore = feedbackScore;
        this.feedbackComment = feedbackComment;
    }
}
