import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ContactsList from "../screens/ContactsList";
import Chat from "../screens/Chat";
import { ChatContext } from "../Contexts/ChatContext";
import { ChatDispatchContext } from "../Contexts/ChatDisptachContext";
import * as SecureStore from 'expo-secure-store'
import configs from "../config/AppConfig";
import { useFocusEffect } from "@react-navigation/native";
import Logger from "../config/Logger";
import { ChatService, ChatServiceCallbacks } from "../services/ChatService";
import { ChatServiceContext } from "../Contexts/ChatServiceContext";

const ChatStackNavigator = createNativeStackNavigator();

interface ChatMessage {
    messageId: string;
    from: string;
    to: string;
    content: string;
    timestamp: number;
    type: string;
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

type ChatAction = 
    | { type: 'ADD_MESSAGE_TO_CHAT'; message: string; contact: string; isSent: boolean; timestamp: number; messageId: string }
    | { type: 'UPDATE_MESSAGE_STATUS'; messageId: string; status: 'sent' | 'delivered' | 'read'; timestamp: number }
    | { type: 'SET_CONVERSATION_HISTORY'; contact: string; messages: ChatMessage[]; unreadCount: number }
    | { type: 'SET_TYPING_STATUS'; contact: string; isTyping: boolean }
    | { type: 'SET_ONLINE_STATUS'; contact: string; isOnline: boolean }
    | { type: 'UPDATE_UNREAD_COUNTS'; counts: { [contact: string]: number }; total: number }
    | { type: 'CLEAR_UNREAD_COUNT'; contact: string }
    | { type: 'INITIALIZE_CONTACT'; contact: string }
    | { type: 'LOAD_CONVERSATION_HISTORY'; contact: string; messages: ChatMessage[] }

const chatReducer = (prevState: ChatState, action: ChatAction): ChatState => {
    switch (action.type) {
        case 'INITIALIZE_CONTACT': {
            const exists = prevState.chat.find(e => e.contact === action.contact);
            if (!exists) {
                prevState.chat.push({
                    contact: action.contact,
                    messages: [],
                    unreadCount: 0,
                    isTyping: false,
                    isOnline: false
                });
            }
            return { ...prevState };
        }

        case 'ADD_MESSAGE_TO_CHAT': {
            const entryIndex = prevState.chat.findIndex(e => e.contact === action.contact);
            
            if (entryIndex === -1) {
                // Create new entry if it doesn't exist
                return {
                    ...prevState,
                    chat: [
                        ...prevState.chat,
                        {
                            contact: action.contact,
                            messages: [{
                                messageId: action.messageId,
                                from: action.isSent ? '' : action.contact,
                                to: action.isSent ? action.contact : '',
                                content: action.message,
                                type: 'text',
                                timestamp: action.timestamp,
                                status: { sent: action.isSent ? action.timestamp : undefined }
                            }],
                            unreadCount: action.isSent ? 0 : 1,
                            isTyping: false,
                            isOnline: false
                        }
                    ]
                };
            }
            
            // Add message to existing entry
            return {
                ...prevState,
                chat: prevState.chat.map((entry, idx) => {
                    if (idx === entryIndex) {
                        return {
                            ...entry,
                            messages: [
                                ...entry.messages,
                                {
                                    messageId: action.messageId,
                                    from: action.isSent ? '' : action.contact,
                                    to: action.isSent ? action.contact : '',
                                    content: action.message,
                                    type: 'text',
                                    timestamp: action.timestamp,
                                    status: { sent: action.isSent ? action.timestamp : undefined }
                                }
                            ],
                            unreadCount: action.isSent ? entry.unreadCount : entry.unreadCount + 1
                        };
                    }
                    return entry;
                }),
                totalUnread: prevState.totalUnread + (action.isSent ? 0 : 1)
            };
        }

        case 'UPDATE_MESSAGE_STATUS': {
            for (let i = 0; i < prevState.chat.length; i++) {
                const chatEntry = prevState.chat[i];
                const messageIndex = chatEntry.messages.findIndex(m => m.messageId === action.messageId);
                if (messageIndex !== -1) {
                    const message = chatEntry.messages[messageIndex];
                    let statusChanged = false;
                    
                    if (action.status === 'delivered' && !message.status.delivered) {
                        message.status.delivered = action.timestamp;
                        statusChanged = true;
                    } else if (action.status === 'read' && !message.status.read) {
                        message.status.read = action.timestamp;
                        statusChanged = true;
                    }
                    
                    if (statusChanged) {
                        // Return new state with new messages array reference
                        return {
                            ...prevState,
                            chat: prevState.chat.map((entry, idx) => 
                                idx === i 
                                    ? { ...entry, messages: [...entry.messages] }
                                    : entry
                            )
                        };
                    }
                    return prevState;
                }
            }
            return prevState;
        }

        case 'SET_CONVERSATION_HISTORY': {
            // Normalize messages from backend to ensure consistent format
            const normalizedMessages = (action.messages || []).map((msg: any) => ({
                messageId: msg.messageId,
                from: typeof msg.from === 'string' ? msg.from : (msg.from?.sub || ''),
                to: typeof msg.to === 'string' ? msg.to : (msg.to?.sub || ''),
                content: msg.content || msg.message || '',
                timestamp: msg.timestamp,
                type: msg.type || 'text',
                status: msg.status || { sent: msg.timestamp }
            }));
            
            const entryIndex = prevState.chat.findIndex(e => e.contact === action.contact);
            if (entryIndex !== -1) {
                // Create new entry object instead of mutating
                const updatedEntry = {
                    ...prevState.chat[entryIndex],
                    messages: normalizedMessages,
                    unreadCount: action.unreadCount
                };
                return {
                    ...prevState,
                    chat: prevState.chat.map((entry, idx) => idx === entryIndex ? updatedEntry : entry)
                };
            } else {
                // Create new entry if contact doesn't exist
                return {
                    ...prevState,
                    chat: [
                        ...prevState.chat,
                        {
                            contact: action.contact,
                            messages: normalizedMessages,
                            unreadCount: action.unreadCount,
                            isTyping: false,
                            isOnline: false
                        }
                    ]
                };
            }
        }

        case 'SET_TYPING_STATUS': {
            const entryIndex = prevState.chat.findIndex(e => e.contact === action.contact);
            if (entryIndex !== -1) {
                return {
                    ...prevState,
                    chat: prevState.chat.map((entry, idx) => 
                        idx === entryIndex
                            ? { ...entry, isTyping: action.isTyping }
                            : entry
                    )
                };
            } else {
                // Create entry if it doesn't exist
                return {
                    ...prevState,
                    chat: [
                        ...prevState.chat,
                        {
                            contact: action.contact,
                            messages: [],
                            unreadCount: 0,
                            isTyping: action.isTyping,
                            isOnline: false
                        }
                    ]
                };
            }
        }

        case 'SET_ONLINE_STATUS': {
            const entryIndex = prevState.chat.findIndex(e => e.contact === action.contact);
            if (entryIndex !== -1) {
                return {
                    ...prevState,
                    chat: prevState.chat.map((entry, idx) => 
                        idx === entryIndex
                            ? { ...entry, isOnline: action.isOnline }
                            : entry
                    )
                };
            } else {
                // Create entry if it doesn't exist
                return {
                    ...prevState,
                    chat: [
                        ...prevState.chat,
                        {
                            contact: action.contact,
                            messages: [],
                            unreadCount: 0,
                            isTyping: false,
                            isOnline: action.isOnline
                        }
                    ]
                };
            }
        }

        case 'UPDATE_UNREAD_COUNTS': {
            for (const [contact, count] of Object.entries(action.counts)) {
                const entry = prevState.chat.find(e => e.contact === contact);
                if (entry) {
                    entry.unreadCount = count;
                }
            }
            prevState.totalUnread = action.total;
            return { ...prevState, chat: [...prevState.chat] };
        }

        case 'CLEAR_UNREAD_COUNT': {
            const entry = prevState.chat.find(e => e.contact === action.contact);
            if (entry) {
                prevState.totalUnread -= entry.unreadCount;
                entry.unreadCount = 0;
            }
            return { ...prevState, chat: [...prevState.chat] };
        }

        case 'LOAD_CONVERSATION_HISTORY':
            return {
                ...state,
                chat: state.chat.map((entry: any) => 
                    entry.contact === action.contact 
                        ? { ...entry, messages: action.messages }
                        : entry
                )
            };

        default:
            return prevState;
    }
};

const ChatNavigator = () => {
    const [chatService, setChatService] = useState<ChatService | null>(null);
    const chatServiceRef = useRef<ChatService | null>(null);
    const [token, setToken] = useState("");
    
    const initialChat: ChatState = {
        chat: [],
        totalUnread: 0
    };
    
    const [chat, dispatch] = useReducer(chatReducer, initialChat);

    useEffect(() => {
        let isMounted = true;
        
        const initChatService = async () => {
            try {
                const userToken = await SecureStore.getItemAsync("userToken");
                if (!isMounted) return;
                
                setToken(userToken ?? "");

                // Create ChatService instance
                const service = new ChatService();
                chatServiceRef.current = service;
                setChatService(service);

                // Define callbacks for all socket events
                const callbacks: ChatServiceCallbacks = {
                    onRegistrationSuccess: (response) => {
                        if (isMounted) {
                            Logger.success('CHAT', 'Successfully registered with chat server');
                            // Load unread counts on registration
                            // Note: Conversation history is loaded per-contact when opening the Chat screen
                            service.getUnreadCounts();
                        }
                    },

                    onMessageSentAck: (data) => {
                        if (isMounted) {
                            Logger.debug('CHAT', `Message ${data.messageId} sent to ${data.to}`);
                            dispatch({
                                type: 'UPDATE_MESSAGE_STATUS',
                                messageId: data.messageId,
                                status: 'sent',
                                timestamp: data.timestamp
                            });
                        }
                    },

                    onMessageReceived: (data) => {
                        if (isMounted) {
                            const contactEmail = data.from.sub || data.from;
                            Logger.info('CHAT', `Received message from ${contactEmail}: ${data.message}`);
                            
                            dispatch({
                                type: 'ADD_MESSAGE_TO_CHAT',
                                message: data.message,
                                contact: contactEmail,
                                isSent: false,
                                timestamp: data.timestamp,
                                messageId: data.messageId
                            });

                            // Auto-acknowledge delivery
                            service.markMessageDelivered(data.messageId);
                        }
                    },

                    onMessageDelivered: (data) => {
                        if (isMounted) {
                            Logger.debug('CHAT', `Message ${data.messageId} delivered`);
                            dispatch({
                                type: 'UPDATE_MESSAGE_STATUS',
                                messageId: data.messageId,
                                status: 'delivered',
                                timestamp: data.deliveredAt || Date.now()
                            });
                        }
                    },

                    onMessageRead: (data) => {
                        if (isMounted) {
                            Logger.debug('CHAT', `Message ${data.messageId} read`);
                            dispatch({
                                type: 'UPDATE_MESSAGE_STATUS',
                                messageId: data.messageId,
                                status: 'read',
                                timestamp: data.readAt || Date.now()
                            });
                        }
                    },

                    onConversationHistory: (data) => {
                        if (isMounted) {
                            Logger.debug('CHAT', `Loaded ${data.messages?.length || 0} messages from ${data.with}`);
                            dispatch({
                                type: 'SET_CONVERSATION_HISTORY',
                                contact: data.with,
                                messages: data.messages || [],
                                unreadCount: 0
                            });
                        }
                    },

                    onUnreadCounts: (data) => {
                        if (isMounted) {
                            Logger.debug('CHAT', `Total unread messages: ${data.total}`);
                            dispatch({
                                type: 'UPDATE_UNREAD_COUNTS',
                                counts: data.counts,
                                total: data.total
                            });
                        }
                    },

                    onUserTyping: (data) => {
                        if (isMounted) {
                            Logger.debug('CHAT', `User typing: ${data.from} - ${data.isTyping}`);
                            dispatch({
                                type: 'SET_TYPING_STATUS',
                                contact: data.from,
                                isTyping: data.isTyping
                            });
                        }
                    },

                    onOnlineStatus: (data) => {
                        if (isMounted) {
                            Logger.debug('CHAT', 'Received online status update');
                            for (const [email, isOnline] of Object.entries(data.status)) {
                                dispatch({
                                    type: 'SET_ONLINE_STATUS',
                                    contact: email,
                                    isOnline: isOnline as boolean
                                });
                            }
                        }
                    },

                    onDisconnect: (reason) => {
                        if (isMounted) {
                            Logger.warning('CHAT', `Disconnected from chat: ${reason}`);
                        }
                    },

                    onConnectionError: (error) => {
                        if (isMounted) {
                            Logger.error('CHAT', 'Chat connection error:', error);
                        }
                    }
                };

                // Initialize the ChatService with callbacks
                await service.initialize(userToken ?? "", callbacks);

                Logger.info('CHAT', 'ChatService initialized successfully');
            } catch (error) {
                Logger.error('CHAT', 'Failed to initialize ChatService:', error);
            }
        };
        
        initChatService();
        
        return () => {
            isMounted = false;
            if (chatServiceRef.current) {
                Logger.info('CHAT', 'Disconnecting ChatService');
                chatServiceRef.current.disconnect();
                chatServiceRef.current = null;
                setChatService(null);
            }
        };
    }, []);

    return (
        <ChatServiceContext.Provider value={chatService}>
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
        </ChatServiceContext.Provider>
    );
}

export default ChatNavigator;