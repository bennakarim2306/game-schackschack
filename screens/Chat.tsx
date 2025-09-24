import { useEffect, useRef, useState } from "react";
import { Button, FlatList, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";
import { useChatContext } from "../Contexts/ChatContext";
import ChatStyles from "../styles/ChatStyles";

const Chat = ({ navigation, route }) => {
    const socket = useRef();
    const chatDispatch = useChatDispatchContext();
    const [messageToSend, setMessageToSend] = useState("");
    const [token, setToken] = useState("");
    const chatState = useChatContext();
    const dispatchChatMessage = useChatDispatchContext();

    const submitMessage = () => {
        dispatchChatMessage({
            type: "ADD_MESSAGE_TO_CHAT",
            message: messageToSend,
            contact: route.params.contact,
            isSent: true,
            timestamp: Date.now(),
            isRead: true
        });
        setMessageToSend("");
    };

    const getTimeFromTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
    };

    const getChatMessagesAndAndSetToRead = () => {
        const messages =
            chatState.chat.filter(e => e.contact === route.params.contact).length > 0
                ? chatState.chat.filter(e => e.contact === route.params.contact)[0].messages
                : [];
        return messages;
    };

    return (
        <KeyboardAvoidingView
            style={ChatStyles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={80}
        >
            <FlatList
                style={ChatStyles.chatList}
                contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
                data={getChatMessagesAndAndSetToRead()}
                inverted
                renderItem={({ item }) => (
                    <View style={[
                        ChatStyles.chatTextBox,
                        item.isSent ? ChatStyles.sentBox : ChatStyles.receivedBox
                    ]}>
                        <Text style={ChatStyles.chatTimetext}>
                            {getTimeFromTimestamp(item.timestamp)}
                        </Text>
                        <Text style={[
                            ChatStyles.chatText,
                            item.isSent ? ChatStyles.sentText : ChatStyles.receivedText
                        ]}>
                            {item.message}
                        </Text>
                    </View>
                )}
                keyExtractor={(_, idx) => idx.toString()}
                ListEmptyComponent={
                    <Text style={ChatStyles.emptyText}>No messages yet. Start the conversation!</Text>
                }
            />
            <View style={ChatStyles.inputRow}>
                <TextInput
                    style={ChatStyles.input}
                    onChangeText={setMessageToSend}
                    placeholder="Type your message..."
                    value={messageToSend}
                />
                <Button
                    title="Send"
                    onPress={submitMessage}
                    disabled={!messageToSend.trim()}
                    color="#2196F3"
                />
            </View>
        </KeyboardAvoidingView>
    );
};

export default Chat;