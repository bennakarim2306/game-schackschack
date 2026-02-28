export type TransactionRole = "buyer" | "seller";

export interface TransactionData {
    id: string;
    itemId?: string;
    buyerName?: string;
    buyerEmail?: string;
    sellerName?: string;
    sellerEmail?: string;
    quantityOrdered?: number;
    unit?: string;
    totalPrice?: number;
    status?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}
