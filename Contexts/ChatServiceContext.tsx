import { createContext, useContext } from "react";
import { ChatService } from "../services/ChatService";

export const ChatServiceContext = createContext<ChatService | null>(null);

export const useChatServiceContext = () => {
    return useContext(ChatServiceContext);
};
