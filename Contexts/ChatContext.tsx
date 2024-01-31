import { createContext, useContext } from "react";


export const ChatContext = createContext(null);

export const useChatContext = () => {
    return useContext(ChatContext)
}