import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MutableRefObject, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ContactsList from "../screens/ContactsList"; // Renamed FriendsList to ContactsList
import Chat from "../screens/Chat";
import { ChatContext } from "../Contexts/ChatContext";
import { ChatDispatchContext } from "../Contexts/ChatDisptachContext";
import io, { Socket } from "socket.io-client";
import * as SecureStore from 'expo-secure-store'
import configs from "../config/AppConfig";
import { useFocusEffect } from "@react-navigation/native";
import Logger from "../config/Logger";

const ChatStackNavigator = createNativeStackNavigator();

const ChatNavigator = () => {

    const socket: MutableRefObject<Socket<any> | undefined> = useRef();
    const [token, setToken] = useState("");
    
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

    interface AddMessageToChatAction {
        type: 'ADD_MESSAGE_TO_CHAT';
        message: string;
        contact: string;
        isSent: boolean;
        timestamp: number;
        isRead: boolean;
    }

    interface SetMessagesToReadAction {
        type: 'SET_MESSAGES_TO_READ';
        email: string;
    }

    type ChatAction = AddMessageToChatAction | SetMessagesToReadAction;

    const chatReducer = (prevState: ChatState, action: ChatAction): ChatState => {
        switch (action.type) {
            case 'ADD_MESSAGE_TO_CHAT': {
                if (
                    prevState.chat.length == 0 &&
                    prevState.chat.filter(e => e.contact === action.contact).length == 0
                ) {
                    console.log(`Adding a chat with contact: ${action.contact} to the state`);
                    prevState.chat.push({
                        contact: action.contact,
                        messages: new Array<ChatMessage>()
                    });
                }
                if (action.isSent === true) {
                    Logger.info('CHAT', `Sending message to ${action.contact}`);
                    Logger.debug('CHAT', `Message content: ${action.message}`);
                    socket.current?.emit("private-message", { token: token, to: action.contact, message: action.message });
                }
                const currentChat = prevState.chat.filter(e => e.contact === action.contact)[0];
                currentChat.messages.push({
                    isSent: action.isSent,
                    message: action.message,
                    timestamp: action.timestamp,
                    read: action.isRead
                });
                console.log(`Returning state ${JSON.stringify(prevState.chat)}`);
                return {
                    ...prevState
                };
            }
            case 'SET_MESSAGES_TO_READ': {
                if (
                    prevState.chat.length == 0 ||
                    prevState.chat.filter(e => e.contact == action.email).length == 0
                ) {
                    return {
                        ...prevState
                    };
                }
                const messages = prevState.chat.filter(e => e.contact == action.email)[0].messages;
                messages.forEach(m => m.read = true);
                return {
                    ...prevState
                };
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
            setToken(token ?? "")
            
            Logger.info('SOCKET', `Connecting to: ${configs.WEBSOCKER_BASE_URL}`);
            socket.current = io(configs.WEBSOCKER_BASE_URL)
            
            socket.current?.on("connect", () => {
                Logger.success('SOCKET', 'Connected to WebSocket server');
            });
            
            socket.current?.on("disconnect", (reason) => {
                Logger.warning('SOCKET', `Disconnected: ${reason}`);
            });
            
            socket.current?.on("error", (error) => {
                Logger.error('SOCKET', 'Socket error', error);
            });
            
            socket.current?.on("response from server", (message: string) => {
                Logger.info('SOCKET', "Received response: " + message);
            });
            
            socket.current?.on("private-message-from-server", (message: { from: { sub: string }, message: string }) => {
                Logger.info('CHAT', `Message from ${message.from.sub}: ${message.message}`);
                dispatch({ type: "ADD_MESSAGE_TO_CHAT", message: message.from.sub.split("@")[0] + ": " + message.message, contact: message.from.sub, isSent: false, timestamp: Date.now(), isRead: false})
            });
            
            Logger.info('SOCKET', 'Registering client with token');
            socket.current?.emit("register-client", { token: token })
        }
        initSocketConnection()
    },[])

    return (
        <ChatContext.Provider value={chat}>
            <ChatDispatchContext.Provider value={dispatch}>
                <ChatStackNavigator.Navigator
                    initialRouteName="ContactsList"
                    screenOptions={{
                        headerShown: false
                    }}
                >
                    <ChatStackNavigator.Screen
                        name="ContactsList"
                        component={ContactsList}
                    />
                    <ChatStackNavigator.Screen
                        name="Chat"
                        component={Chat}
                    />
                </ChatStackNavigator.Navigator>
            </ChatDispatchContext.Provider>
        </ChatContext.Provider>
    );
}

export default ChatNavigator;