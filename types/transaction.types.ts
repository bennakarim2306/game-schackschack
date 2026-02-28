export type TransactionRole = "buyer" | "seller";

export interface ItemSummary {
    id?: string;
    name?: string;
    type?: string;
    pricePerUnit?: number;
    thumbnail?: string;
    unit?: string;
    availableTo?: string;
}

export interface TransactionData {
    id: string;
    itemId?: string;
    item?: ItemSummary;
    buyerName?: string;
    buyerEmail?: string;
    sellerName?: string;
    sellerEmail?: string;
    quantityOrdered?: number;
    unit?: string;
    totalPrice?: number;
    pricePerUnit?: number;
    status?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}
