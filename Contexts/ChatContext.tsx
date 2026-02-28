import { createContext, useContext } from "react";

interface ChatMessage {
    messageId: string;
    from: string;
    to: string;
    content: string;
    message?: string;
    timestamp: number;
    status: {
        sent?: number;
        delivered?: number;
        read?: number;
    };
}

interface ChatEntry {
    contact: string;
    messages: ChatMessage[];
    unreadCount: number;
    isTyping: boolean;
    isOnline: boolean;
    pinnedTransaction?: {
        transaction: any;
        role: 'buyer' | 'seller';
    };
}

interface ChatState {
    chat: ChatEntry[];
    totalUnread: number;
}

export const ChatContext = createContext<ChatState | null>(null);

export const useChatContext = () => {
    return useContext(ChatContext)
}