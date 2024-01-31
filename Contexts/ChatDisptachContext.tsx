import { createContext, useContext } from "react";


export const ChatDispatchContext = createContext(null)

export function useChatDispatchContext() {
    return useContext(ChatDispatchContext)
}