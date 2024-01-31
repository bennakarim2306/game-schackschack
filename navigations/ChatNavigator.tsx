import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MutableRefObject, useEffect, useMemo, useReducer, useRef, useState } from "react";
import FriendsList from "../screens/FriendsList";
import Chat from "../screens/Chat";
import { ChatContext } from "../Contexts/ChatContext";
import { ChatDispatchContext } from "../Contexts/ChatDisptachContext";
import io, { Socket } from "socket.io-client";
import * as SecureStore from 'expo-secure-store'

const ChatStackNavigator = createNativeStackNavigator();

const ChatNavigator = () => {

    const socket: MutableRefObject<Socket<any> | undefined> = useRef(io("http://192.168.1.21:3000"));
    const [token, setToken] = useState("");
    
    const chatReducer = (prevState, action) => {
        switch (action.type) {
            case 'ADD_MESSAGE_TO_CHAT': {
                if (prevState.chat.length == 0 && prevState.chat.filter(e => e.contact === action.contact).length == 0) {
                    console.log(`Adding a chat with contact: ${action.contact} to the state`)
                    prevState.chat.push({
                        contact: action.contact,
                        messages: new Array<{isSent: boolean, message: string}>()
                    })
                }
                if (action.isSent === true) {
                    console.log(`Sending message to ${action.contact} with content: ${action.message}`)
                    socket.current?.emit("private-message", { token: token, to: action.contact, message: action.message })
                }
                const currentChat = prevState.chat.filter(e => e.contact === action.contact)[0]
                currentChat.messages.push({
                    isSent: action.isSent,
                    message: action.message
                })
                console.log(`Returning state ${JSON.stringify(prevState.chat)}`)
                return {
                    ...prevState
                }
            }
        }
    }
    // we need to gather the chats from backend when the app starts
    const initialChat = {
        chat: []
    }
    const [chat, dispatch] = useReducer(chatReducer,initialChat)

    useEffect(() => {
        const initSocketConnection = async () => {
            const token = await SecureStore.getItemAsync("userToken");
            setToken(token)
            socket.current?.on("response from server", message => console.log("Received socket message from backend " + message))
            socket.current?.on("private-message-from-server", (message) => {
                dispatch({ type: "ADD_MESSAGE_TO_CHAT", message: message.from.sub + ": " + message.message, contact: message.from.sub, isSent: false })
            })
            socket.current?.emit("register-client", { token: token })
        }
        initSocketConnection()
    },[])
    
    // const chatContext = useMemo(() => ({
    //     updateChat: ({ isSent, contact, message }) => {
    //         dispatch({ type: 'ADD_MESSAGE_TO_CHAT_STORAGE', isSent: isSent, contact: contact, message: message })
    //     },
    //     initSocket: async () => {
    //         if (token && socket) return
    //         const token = await SecureStore.getItemAsync("userToken");
    //         setToken(token)
    //         socket.current = io("http://192.168.1.21:3000")
    //         socket.current.on("response from server", message => console.log("Received socket message from backend " + message))
    //         socket.current.on("private-message-from-server", message => {
    //             console.log(`Received private message from ${message.from.sub} with content: ${message.message}`)
    //             dispatch({ type: "ADD_MESSAGE_TO_CHAT_STORAGE", message: message.from.sub + ": " + message.message, contact: message.from.sub, isSent: false })
    //             //dispatch({ type: "ADD_MESSAGE", message: message.from.sub + ": " + message.message, contact: message.from.sub, isSent: false })
    //         })
    //         socket.current.emit("register-client", { token: token })
    //     },
    //     getSocket: () => {
    //         return socket.current
    //     },
    //     getChatWithContact: (contact) => {
    //         const chat = state.chat.filter(e => e.contact === contact)[0]
    //         console.log(`getChatWithContact returning ${JSON.stringify(chat)}`)
    //         if (chat != null && chat != undefined && chat.messages.length > 0) {
    //             return {
    //                 messages: chat.messages,
    //                 contact: contact
    //             }
    //         } else {
    //             return {
    //                 contact: contact,
    //                 messages: []
    //             }
    //         }
    //     },
    //     stateChat: () => state.chat
    // }),
    //     []);

    return (
        <ChatContext.Provider value={chat}>
            <ChatDispatchContext.Provider value={dispatch}>
                <ChatStackNavigator.Navigator
                    initialRouteName="FriendsList"
                    screenOptions={{
                        headerBackTitleVisible: true
                    }}
                >
                    <ChatStackNavigator.Screen name="FriendsList" component={FriendsList}></ChatStackNavigator.Screen>
                    <ChatStackNavigator.Screen name="Chat" component={Chat} options={({ route }) => ({ title: route.params.title })}></ChatStackNavigator.Screen>
                </ChatStackNavigator.Navigator>
            </ChatDispatchContext.Provider>
        </ChatContext.Provider>

    );
}

export default ChatNavigator;