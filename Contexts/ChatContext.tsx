import { createContext, useContext } from "react";

interface ChatMessage {
    messageId: string;
    from: string;
    to: string;
    message: string;
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
}

interface ChatState {
    chat: ChatEntry[];
    totalUnread: number;
}

export const ChatContext = createContext<ChatState | null>(null);

export const useChatContext = () => {
    return useContext(ChatContext)
}