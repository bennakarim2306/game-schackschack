import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MutableRefObject, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import ContactsList from "../screens/ContactsList"; // Renamed FriendsList to ContactsList
import Chat from "../screens/Chat";
import { ChatContext } from "../Contexts/ChatContext";
import { ChatDispatchContext } from "../Contexts/ChatDisptachContext";
import io, { Socket } from "socket.io-client";
import * as SecureStore from 'expo-secure-store'
import configs from "../config/AppConfig";
import { useFocusEffect } from "@react-navigation/native";

const ChatStackNavigator = createNativeStackNavigator();

const ChatNavigator = () => {

    const socket: MutableRefObject<Socket<any> | undefined> = useRef();
    const [token, setToken] = useState("");
    
    const chatReducer = (prevState, action) => {
        switch (action.type) {
            case 'ADD_MESSAGE_TO_CHAT': {
                if (prevState.chat.length == 0 && prevState.chat.filter(e => e.contact === action.contact).length == 0) {
                    console.log(`Adding a chat with contact: ${action.contact} to the state`)
                    prevState.chat.push({
                        contact: action.contact,
                        messages: new Array<{isSent: boolean, message: string, timestamp: number, read: boolean}>()
                    })
                }
                if (action.isSent === true) {
                    console.log(`Sending message to ${action.contact} with content: ${action.message}`)
                    socket.current?.emit("private-message", { token: token, to: action.contact, message: action.message })
                }
                const currentChat = prevState.chat.filter(e => e.contact === action.contact)[0]
                currentChat.messages.push({
                    isSent: action.isSent,
                    message: action.message,
                    timestamp: action.timestamp,
                    read: action.isRead
                })
                console.log(`Returning state ${JSON.stringify(prevState.chat)}`)
                return {
                    ...prevState
                }
            }
            case 'SET_MESSAGES_TO_READ': {
                    if (prevState.chat.length == 0 || prevState.chat.filter(e => e.contact == action.email).lenght == 0) {
                        return {
                            ...prevState
                        }
                    }
                    const messages = prevState.chat.filter(e => e.contact == action.email)[0].messages
                    messages.forEach(m => m.read = true)
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
            socket.current = io(configs.WEBSOCKER_BASE_URL)
            socket.current?.on("response from server", message => console.log("Received socket message from backend " + message))
            socket.current?.on("private-message-from-server", (message) => {
                dispatch({ type: "ADD_MESSAGE_TO_CHAT", message: message.from.sub.split("@")[0] + ": " + message.message, contact: message.from.sub, isSent: false, timestamp: Date.now(), isRead: false})
            })
            socket.current?.emit("register-client", { token: token })
        }
        initSocketConnection()
    },[])
    
    // Add state for contacts list
    const [contactsList, setContactsList] = useState([]);

    // Fetch contacts list every time ContactsList screen is focused
    useFocusEffect(
        useCallback(() => {
            const fetchContactsList = async () => {
                try {
                    // Replace with your backend endpoint
                    const token = await SecureStore.getItemAsync("userToken");
                    console.debug(`Fetching contacts list with token: ${token}`);
                    const response = await fetch(configs.USER_AUTH_BASE_URL + configs.USER_AUTH_CONTACTS_LIST_PATH, {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (!response.ok) {
                        throw new Error("Failed to fetch contacts list");
                    }
                    const contacts = await response.json();
                    setContactsList(contacts);
                    console.debug("Fetched contacts list:", contacts);
                } catch (error) {
                    console.error("Error fetching contacts list:", error);
                }
            };
            fetchContactsList();
        }, [])
    );

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
                    initialRouteName="ContactsList"
                    screenOptions={{
                        headerBackTitleVisible: true
                    }}
                >
                    <ChatStackNavigator.Screen
                        name="ContactsList"
                        // Pass contactsList as a prop if needed:
                        // children={() => <ContactsList contactsList={contactsList} />}
                        component={ContactsList}
                    />
                    <ChatStackNavigator.Screen
                        name="Chat"
                        component={Chat}
                        options={({ route }) => ({ title: route.params.title })}
                    />
                </ChatStackNavigator.Navigator>
            </ChatDispatchContext.Provider>
        </ChatContext.Provider>

    );
}

export default ChatNavigator;