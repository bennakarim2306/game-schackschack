import React, { useEffect, useRef, useState, useMemo } from "react";
import {
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";
import { useChatContext } from "../Contexts/ChatContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logger from "../config/Logger";

const MessageBubble = ({ item, getTimeFromTimestamp }) => (
    <View style={{
        maxWidth: "80%",
        alignSelf: item.isSent ? "flex-end" : "flex-start",
        backgroundColor: item.isSent ? "#2196F3" : "#e0e0e0",
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
            color: item.isSent ? "#bbdefb" : "#888",
            marginBottom: 2,
            textAlign: item.isSent ? "right" : "left"
        }}>
            {getTimeFromTimestamp(item.timestamp)}
        </Text>
        <Text style={{
            fontSize: 16,
            color: item.isSent ? "#fff" : "#333",
            textAlign: item.isSent ? "right" : "left"
        }}>
            {item.message}
        </Text>
    </View>
);

const Chat = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const chatDispatch = useChatDispatchContext();
    const [messageToSend, setMessageToSend] = useState("");
    const chatState = useChatContext();
    const flatListRef = useRef(null);
    const contact = route.params?.contact || 'Chat';
    
    useEffect(() => {
        Logger.info('CHAT', `Chat screen opened with contact: ${route.params?.contact || 'unknown'}`);
        Logger.debug('CHAT', `ChatState available: ${!!chatState}`);
        return () => {
            Logger.debug('CHAT', `Chat screen unmounted for: ${route.params?.contact || 'unknown'}`);
        };
    }, [route.params?.contact, chatState]);

    const chatMessages = useMemo(() => {
        if (!chatState?.chat) {
            Logger.debug('CHAT', 'No chat state or chat array available');
            return [];
        }
        const entry = chatState.chat.find(e => e.contact === route.params?.contact);
        if (!entry) {
            Logger.debug('CHAT', `No messages found for contact: ${route.params?.contact}`);
        }
        return entry ? entry.messages : [];
    }, [chatState, route.params?.contact]);

    const submitMessage = () => {
        if (!messageToSend.trim()) {
            Logger.debug('CHAT', 'Empty message - not sending');
            return;
        }
        if (!route.params?.contact) {
            Logger.error('CHAT', 'No contact specified - cannot send message');
            return;
        }
        Logger.info('CHAT', `Submitting message to ${route.params.contact}`);
        chatDispatch({
            type: "ADD_MESSAGE_TO_CHAT",
            message: messageToSend,
            contact: route.params.contact,
            isSent: true,
            timestamp: Date.now(),
            isRead: true
        });
        setMessageToSend("");
    };

    const getTimeFromTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        if (flatListRef.current && chatMessages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [chatMessages.length]);

    return (
        <View style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
            {/* Custom Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: insets.top,
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
                    <Ionicons name="arrow-back" size={24} color="#d6b6b6ff" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, color: '#d6b6b6ff', fontWeight: '500' }}>
                    {contact}
                </Text>
            </View>
            
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    style={{ flex: 1, paddingHorizontal: 0, paddingTop: 0 }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "flex-end",
                        paddingBottom: 12 + insets.bottom
                    }}
                    data={chatMessages}
                    renderItem={({ item }) => (
                        <MessageBubble item={item} getTimeFromTimestamp={getTimeFromTimestamp} />
                    )}
                    keyExtractor={(item, idx) => `${item.timestamp}-${idx}`}
                    ListEmptyComponent={
                        <Text style={{
                            textAlign: "center",
                            color: "#aaa",
                            marginTop: 32,
                            fontSize: 16
                        }}>
                            No messages yet. Start the conversation!
                        </Text>
                    }
                    onContentSizeChange={() => {
                        if (flatListRef.current) {
                            flatListRef.current.scrollToEnd({ animated: true });
                        }
                    }}
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={Keyboard.dismiss}
                />
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    height: 70,
                    paddingHorizontal: 12,
                    backgroundColor: "#fff",
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
                        onChangeText={setMessageToSend}
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
            </KeyboardAvoidingView>
        </View>
    );
};

export default Chat;