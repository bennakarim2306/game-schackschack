import type { TransactionData, TransactionRole } from "../types/transaction.types";

type TransactionMessagePayload = {
    transaction: TransactionData;
    roleForRecipient: TransactionRole;
};

export const TRANSACTION_MESSAGE_PREFIX = "__TRANSACTION__:";

const formatDateTime = (value?: string): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
};

const formatMoney = (amount?: number): string | null => {
    if (typeof amount !== "number" || Number.isNaN(amount)) {
        return null;
    }

    return `$${amount.toFixed(2)}`;
};

const buildHumanReadableTransactionMessage = (
    transaction: TransactionData,
    roleForRecipient: TransactionRole
): string => {
    const quantity = typeof transaction.quantityOrdered === "number"
        ? `${transaction.quantityOrdered}${transaction.unit ? ` ${transaction.unit}` : ""}`
        : null;

    const header = (() => {
        if (transaction.status === "CONFIRMED") {
            return roleForRecipient === "buyer"
                ? "Great news — your order has been confirmed."
                : "You have confirmed this order.";
        }
        if (transaction.status === "REJECTED") {
            return roleForRecipient === "buyer"
                ? "Update: your order has been declined."
                : "You have declined this order.";
        }
        if (transaction.status === "CANCELLED") {
            return roleForRecipient === "buyer"
                ? "Update: this order has been cancelled."
                : "This order has been cancelled.";
        }

        return roleForRecipient === "seller"
            ? "Hey, I want to buy this from you. Can you please confirm the order?"
            : "Hey, this is an update regarding your order.";
    })();

    const lines: string[] = [
        header,
        "",
        "Details: ",
    ];

    if (transaction.id) lines.push(`- Transaction ID: ${transaction.id}`);
    // if (transaction.itemId) lines.push(`- Item ID: ${transaction.itemId}`);
    if (quantity) lines.push(`- Quantity: ${quantity}`);

    const totalPrice = formatMoney(transaction.totalPrice);
    if (totalPrice) lines.push(`- Total price: ${totalPrice}`);

    if (transaction.status) lines.push(`- Status: ${transaction.status}`);

    if (transaction.buyerName || transaction.buyerEmail) {
        lines.push(`- Buyer: ${transaction.buyerName ?? "Unknown"}${transaction.buyerEmail ? ` (${transaction.buyerEmail})` : ""}`);
    }

    if (transaction.sellerName || transaction.sellerEmail) {
        lines.push(`- Seller: ${transaction.sellerName ?? "Unknown"}${transaction.sellerEmail ? ` (${transaction.sellerEmail})` : ""}`);
    }

    const createdAt = formatDateTime(transaction.createdAt);
    const updatedAt = formatDateTime(transaction.updatedAt);
    if (createdAt) lines.push(`- Created at: ${createdAt}`);
    if (updatedAt) lines.push(`- Last updated: ${updatedAt}`);

    if (transaction.notes?.trim()) {
        lines.push(`- Notes: ${transaction.notes.trim()}`);
    }

    return lines.join("\n");
};

export const getTransactionDisplayMessage = (message: string): string => {
    const prefixIndex = message.indexOf(TRANSACTION_MESSAGE_PREFIX);
    if (prefixIndex === -1) {
        return message;
    }

    const humanReadablePart = message.slice(0, prefixIndex).trim();
    if (humanReadablePart) {
        return humanReadablePart;
    }

    const parsed = parseTransactionMessage(message);
    if (!parsed) {
        return message;
    }

    return buildHumanReadableTransactionMessage(parsed.transaction, parsed.roleForRecipient);
};

export const buildTransactionMessage = (
    transaction: TransactionData,
    roleForRecipient: TransactionRole
): string => {
    const humanReadableMessage = buildHumanReadableTransactionMessage(transaction, roleForRecipient);
    return humanReadableMessage;
};

export const parseTransactionMessage = (message: string): TransactionMessagePayload | null => {
    const prefixIndex = message.indexOf(TRANSACTION_MESSAGE_PREFIX);
    if (prefixIndex === -1) {
        return null;
    }

    const rawPayload = message.slice(prefixIndex + TRANSACTION_MESSAGE_PREFIX.length).trim();

    try {
        const payload = JSON.parse(rawPayload) as TransactionMessagePayload;
        if (!payload?.transaction || (payload.roleForRecipient !== "buyer" && payload.roleForRecipient !== "seller")) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
};
