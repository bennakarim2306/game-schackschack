import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    ImageBackground,
    View,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";
import { useChatContext } from "../Contexts/ChatContext";
import { useChatServiceContext } from "../Contexts/ChatServiceContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logger from "../config/Logger";
import uuid from 'react-native-uuid';

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

const MessageBubble = ({ item, getTimeFromTimestamp, currentUserEmail }: any) => {
    const isSent = item.from === '';
    const getStatusIcon = () => {
        if (!isSent) return null;
        
        if (item.status?.read) {
            return <Ionicons name="checkmark-done" size={14} color="#87ceeb" />;
        } else if (item.status?.delivered) {
            return <Ionicons name="checkmark-done" size={14} color="#bbdefb" />;
        } else if (item.status?.sent) {
            return <Ionicons name="checkmark" size={14} color="#bbdefb" />;
        }
        return null;
    };

    return (
        <View style={{
            maxWidth: "80%",
            alignSelf: isSent ? "flex-end" : "flex-start",
            marginHorizontal: 12,
            backgroundColor: isSent ? "#2196F3" : "#e0e0e0",
            borderRadius: 18,
            marginVertical: 4,
            padding: 12,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
        }}>
            <Text style={{
                fontSize: 12,
                color: isSent ? "#bbdefb" : "#888",
                marginBottom: 2,
                textAlign: isSent ? "right" : "left"
            }}>
                {getTimeFromTimestamp(item.timestamp)}
            </Text>
            <Text style={{
                fontSize: 16,
                color: isSent ? "#fff" : "#333",
                textAlign: isSent ? "right" : "left"
            }}>
                {item.content}
            </Text>
            {isSent && (
                <View style={{ marginTop: 2, alignItems: 'flex-end' }}>
                    {getStatusIcon()}
                </View>
            )}
        </View>
    );
};

const Chat = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const chatDispatch = useChatDispatchContext();
    const [messageToSend, setMessageToSend] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const chatState = useChatContext() as any;
    const chatService = useChatServiceContext();
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const typingIntervalRef = useRef<NodeJS.Timeout>();
    const lastLoadedMessagesRef = useRef<number>(0);
    const contact = route.params?.contact || 'Chat';
    
    // Validate contexts are available
    useEffect(() => {
        if (!chatState || !chatDispatch || !chatService) {
            Logger.error('CHAT', 'Missing required context providers!');
            Logger.error('CHAT', `chatState: ${!!chatState}, chatDispatch: ${!!chatDispatch}, chatService: ${!!chatService}`);
            Alert.alert(
                'Configuration Error',
                'Chat service is not properly initialized. Please restart the app.',
                [{ text: 'Go Back', onPress: () => navigation.goBack() }]
            );
        }
    }, [chatState, chatDispatch, chatService, navigation]);
    
    useEffect(() => {
        Logger.info('CHAT', `Chat screen opened with contact: ${route.params?.contact || 'unknown'}`);
        Logger.debug('CHAT', `ChatState available: ${!!chatState}`);
        Logger.debug('CHAT', `Current chat entries: ${chatState?.chat?.length || 0}`);
        
        // Reset loading state for new contact
        lastLoadedMessagesRef.current = 0;
        setIsLoadingHistory(true);
        
        // Load conversation history when opening chat
        if (chatService && route.params?.contact) {
            Logger.debug('CHAT', `Loading conversation history for: ${route.params.contact}`);
            chatService.getConversationHistory(route.params.contact, 50, 0);
        }
        
        return () => {
            Logger.debug('CHAT', `Chat screen unmounted for: ${route.params?.contact || 'unknown'}`);
            
            // Clean up timers
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
            
            // Clear typing status when leaving chat
            if (chatDispatch && route.params?.contact) {
                chatDispatch({
                    type: 'SET_TYPING_STATUS',
                    contact: route.params.contact,
                    isTyping: false
                });
            }
        };
    }, [route.params?.contact, chatService]);

    const chatEntry = useMemo(() => {
        if (!chatState?.chat) {
            Logger.debug('CHAT', 'No chat state available');
            return null;
        }
        const entry = chatState.chat.find((e: any) => e.contact === route.params?.contact);
        if (!entry) {
            Logger.debug('CHAT', `No entry found for contact: ${route.params?.contact}`);
            Logger.debug('CHAT', `Available contacts: ${chatState.chat.map((c: any) => c.contact).join(', ')}`);
        } else {
            Logger.debug('CHAT', `Found chat entry with ${entry.messages?.length || 0} messages`);
        }
        return entry || null;
    }, [chatState, route.params?.contact]);

    const chatMessages = useMemo(() => {
        const messages = chatEntry?.messages || [];
        // Sort messages by timestamp in ascending order (oldest first)
        const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
        Logger.debug('CHAT', `Rendering ${sortedMessages.length} messages`);
        return sortedMessages;
    }, [chatEntry]);

    const isContactTyping = useMemo(() => {
        return chatEntry?.isTyping || false;
    }, [chatEntry]);

    const isContactOnline = useMemo(() => {
        return chatEntry?.isOnline || false;
    }, [chatEntry]);

    const submitMessage = useCallback(() => {
        if (!messageToSend.trim()) {
            Logger.debug('CHAT', 'Empty message - not sending');
            return;
        }
        if (!route.params?.contact) {
            Logger.error('CHAT', 'No contact specified - cannot send message');
            return;
        }
        if (!chatDispatch) {
            Logger.error('CHAT', 'Chat dispatch not available');
            Alert.alert('Error', 'Cannot send message. Chat service unavailable.');
            return;
        }
        
        const messageId = String(uuid.v4());
        Logger.info('CHAT', `Submitting message to ${route.params.contact}`);
        if (chatService) {
            chatService.sendMessage(route.params.contact, messageToSend, messageId);
        } else {
            Logger.warning('CHAT', 'ChatService not available - message not sent to server');
        }
        chatDispatch({
            type: "ADD_MESSAGE_TO_CHAT",
            message: messageToSend,
            contact: route.params.contact,
            isSent: true,
            timestamp: Date.now(),
            messageId: messageId
        });
        setMessageToSend("");
        setIsTyping(false);
        
        // Stop typing indicator and clear timers
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = undefined as any;
        }
        if (chatService && route.params?.contact) {
            chatService.sendStopTyping(route.params.contact);
        }
    }, [messageToSend, route.params?.contact, chatDispatch, chatService]);

    const handleTyping = useCallback((text: string) => {
        setMessageToSend(text);
        
        // Throttled typing indicator - send once on first keystroke
        if (text.length > 0 && chatService && route.params?.contact) {
            // Only send if not already typing or if interval has passed
            if (!typingIntervalRef.current) {
                chatService.sendTyping(route.params.contact);
                setIsTyping(true);
                
                // Resend typing every 2 seconds while user continues typing
                typingIntervalRef.current = setInterval(() => {
                    if (chatService && route.params?.contact) {
                        chatService.sendTyping(route.params.contact);
                    }
                }, 2000);
            }
        }
        
        // Reset typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = undefined as any;
            }
            if (chatService && route.params?.contact) {
                chatService.sendStopTyping(route.params.contact);
            }
        }, 3000);
    }, [chatService, route.params?.contact]);

    const getTimeFromTimestamp = useCallback((timestamp: number) => {
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const displayHours = hours % 12 || 12;  // Convert to 12-hour format
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }, []);

    useEffect(() => {
        if (flatListRef.current && chatMessages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [chatMessages.length]);

    useEffect(() => {
        // Stop loading only when messages actually change from the request
        const currentMessageCount = chatEntry?.messages?.length || 0;
        if (currentMessageCount > lastLoadedMessagesRef.current) {
            Logger.info('CHAT', `Received ${currentMessageCount} messages (was ${lastLoadedMessagesRef.current}), stopping loading animation`);
            lastLoadedMessagesRef.current = currentMessageCount;
            setIsLoadingHistory(false);
        }
    }, [chatEntry?.messages?.length]);
    
    // Fallback: stop loading after timeout
    useEffect(() => {
        if (isLoadingHistory) {
            const timeout = setTimeout(() => {
                Logger.warning('CHAT', 'Loading timeout - stopping loading animation');
                setIsLoadingHistory(false);
            }, 5000);
            
            return () => clearTimeout(timeout);
        }
    }, [isLoadingHistory]);

    useEffect(() => {
        if (!chatService || !contact || chatMessages.length === 0) return;

        const unreadMessageIds = chatMessages
            .filter((message: any) => message.from === contact && !message.status?.read)
            .map((message: any) => message.messageId)
            .filter(Boolean);

        if (unreadMessageIds.length === 0) return;

        chatService.markMessagesAsRead(unreadMessageIds);
        const readTimestamp = Date.now();
        unreadMessageIds.forEach((messageId: string) => {
            chatDispatch({
                type: 'UPDATE_MESSAGE_STATUS',
                messageId,
                status: 'read',
                timestamp: readTimestamp
            });
        });
    }, [chatMessages, contact, chatService, chatDispatch]);

    // Show loading state if contexts aren't ready
    if (!chatState || !chatDispatch || !chatService) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' }}>
                <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                <Text style={{ marginTop: 16, fontSize: 16, color: '#999' }}>
                    Initializing chat...
                </Text>
            </View>
        );
    }

    Logger.debug('CHAT', `isLoadingHistory: ${isLoadingHistory}, chatMessages: ${chatMessages.length}`);

    return (
        <ImageBackground
            source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(247, 247, 247, 0.95)' }}>
                {/* Custom Header with Online Status */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingBottom: 12,
                    backgroundColor: '#ffffffff',
                    borderBottomWidth: 1,
                    borderBottomColor: '#c5bebeff'
                }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ marginRight: 12, padding: 4 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333333" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 18, color: '#333333', fontWeight: '500' }}>
                            {contact}
                        </Text>
                        <Text style={{ fontSize: 12, color: isContactOnline ? '#4caf50' : '#999' }}>
                            {isContactTyping ? 'typing...' : (isContactOnline ? 'Online' : 'Offline')}
                        </Text>
                    </View>
                </View>
                
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 30}
                >
                    {isLoadingHistory ? (
                        <View style={{ 
                            flex: 1, 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                        }}>
                            <Ionicons name="chatbubbles-outline" size={48} color="#2196F3" />
                            <Text style={{ marginTop: 16, fontSize: 14, color: '#666', fontWeight: '500' }}>
                                Loading conversation history...
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            style={{ flex: 1 }}
                            contentContainerStyle={{
                                flexGrow: 1,
                                justifyContent: "flex-end",
                                paddingBottom: 12
                            }}
                            data={chatMessages}
                            extraData={chatState}
                            renderItem={({ item }) => (
                                <MessageBubble 
                                    item={item} 
                                    getTimeFromTimestamp={getTimeFromTimestamp}
                                    currentUserEmail={contact}
                                />
                            )}
                            keyExtractor={(item) => item.messageId}
                            ListEmptyComponent={
                                <View style={{ 
                                    flex: 1, 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    paddingHorizontal: 24 
                                }}>
                                    <Text style={{
                                        textAlign: "center",
                                        color: "#aaa",
                                        fontSize: 16
                                    }}>
                                        No messages yet. Start the conversation!
                                    </Text>
                                </View>
                            }
                            onContentSizeChange={() => {
                                if (flatListRef.current) {
                                    flatListRef.current.scrollToEnd({ animated: true });
                                }
                            }}
                            keyboardShouldPersistTaps="handled"
                            onScrollBeginDrag={Keyboard.dismiss}
                        />
                    )}
                    
                    {/* Typing indicator */}
                    {isContactTyping && (
                        <View style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
                                {contact.split('@')[0]} is typing...
                            </Text>
                        </View>
                    )}
                    
                    {/* Message Input */}
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            height: 70,
                            paddingHorizontal: 12,
                            paddingBottom: 8,
                            paddingTop: 8,
                            backgroundColor: "#ffffff",
                            borderTopWidth: 1,
                            borderTopColor: "#eee",
                            shadowColor: "#000",
                            shadowOpacity: 0.04,
                            shadowRadius: 2,
                            shadowOffset: { width: 0, height: -1 }
                        }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    backgroundColor: "#fff",
                                    borderRadius: 22,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    fontSize: 16,
                                    marginRight: 8,
                                    borderWidth: 1,
                                    borderColor: "#666"
                                }}
                                onChangeText={handleTyping}
                                placeholder="Type your message..."
                                placeholderTextColor="#999"
                                value={messageToSend}
                                returnKeyType="send"
                                onSubmitEditing={submitMessage}
                            />
                            <TouchableOpacity
                                onPress={submitMessage}
                                disabled={!messageToSend.trim()}
                                style={{
                                    backgroundColor: !messageToSend.trim() ? "#b0c4de" : "#2196F3",
                                    borderRadius: 22,
                                    padding: 10,
                                    justifyContent: "center",
                                    alignItems: "center"
                                }}
                            >
                                <Ionicons name="send" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
    );
};

export default Chat;