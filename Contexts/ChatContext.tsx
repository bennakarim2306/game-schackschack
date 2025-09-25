import { createContext, useContext } from "react";

interface ChatMessage {
    isSent: boolean;
    message: string;
    timestamp: number;
    read: boolean;
}

interface ChatEntry {
    contact: string;
    messages: ChatMessage[];
}

interface ChatState {
    chat: ChatEntry[];
}
export const ChatContext = createContext<ChatState | null>(null);

export const useChatContext = () => {
    return useContext(ChatContext)
}