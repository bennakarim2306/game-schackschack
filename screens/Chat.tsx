import { useEffect, useRef, useState } from "react";
import { Button, FlatList, Text, TextInput, TouchableOpacity } from "react-native";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";
import { useChatContext } from "../Contexts/ChatContext";
import ChatStyles from "../styles/ChatStyles";

const Chat = ({ navigation, route }) => {
    const socket = useRef()
    const chatDispatch = useChatDispatchContext()
    const [messageToSend, setMessageToSend] = useState("")
    const [token, setToken] = useState("")
    const chatState = useChatContext();
    const dispatchChatMessage = useChatDispatchContext()

    const submitMessage = () => {
        dispatchChatMessage({ type: "ADD_MESSAGE_TO_CHAT", message: messageToSend, contact:route.params.contact, isSent: true, timestamp: Date.now(), isRead: true})
        setMessageToSend("")
    }

    const getTimeFromTimestamp = (timestamp: number) => {
        const date = new Date(timestamp)
        return `${date.getHours()}:${date.getMinutes()}`
    }

    const getChatMessagesAndAndSetToRead = () => {
        const messages = chatState.chat.filter(e => e.contact === route.params.contact).length > 0 ? chatState.chat.filter(e => e.contact === route.params.contact)[0].messages : []
        return messages
    }
    return (
        <>
            <FlatList
                style={{flexDirection: 'column-reverse'}}
                data={getChatMessagesAndAndSetToRead()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        key={item.message}
                        onPress={event => {}}
                        style={ChatStyles.chatTextBox}>
                        <Text 
                            style={{
                                ...ChatStyles.chatTimetext,
                                alignSelf: item.isSent ? 'flex-end' : 'flex-start'
                            }}>
                            {getTimeFromTimestamp(item.timestamp)}
                        </Text>
                        <Text
                            style={{
                                ...ChatStyles.chatText,
                                alignSelf: item.isSent ? 'flex-end' : 'flex-start',
                                backgroundColor: item.isSent ? "#90EE90" : "white",
                            }}>
                            {item.message}
                        </Text>
                    </TouchableOpacity>)}>
            </FlatList>
            <TextInput
                style={{}}
                onChangeText={(text) => setMessageToSend(text)}
                placeholder="type something here"
                value={messageToSend}
            // defaultValue="text input for userName"
            />
            <Button
                title="Send"
                onPress={() => submitMessage()}
                disabled={false}
            />
        </>
    );
}

export default Chat;