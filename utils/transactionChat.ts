import type { TransactionData, TransactionRole } from "../types/transaction.types";

type TransactionMessagePayload = {
    transaction: TransactionData;
    roleForRecipient: TransactionRole;
};

export const TRANSACTION_MESSAGE_PREFIX = "__TRANSACTION__:";

export const buildTransactionMessage = (
    transaction: TransactionData,
    roleForRecipient: TransactionRole
): string => {
    const payload: TransactionMessagePayload = { transaction, roleForRecipient };
    return `${TRANSACTION_MESSAGE_PREFIX}${JSON.stringify(payload)}`;
};

export const parseTransactionMessage = (message: string): TransactionMessagePayload | null => {
    if (!message.startsWith(TRANSACTION_MESSAGE_PREFIX)) {
        return null;
    }

    const rawPayload = message.slice(TRANSACTION_MESSAGE_PREFIX.length);

    try {
        const payload = JSON.parse(rawPayload) as TransactionMessagePayload;
        if (!payload?.transaction) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
};
