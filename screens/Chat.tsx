import { useContext, useEffect, useReducer, useRef, useState } from "react";
import { Button, FlatList, Text, TextInput, TouchableOpacity } from "react-native";
import * as SecureStore from 'expo-secure-store'
import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";
import { useChatContext } from "../Contexts/ChatContext";

const Chat = ({ navigation, route }) => {
    const socket = useRef()
    const chatDispatch = useChatDispatchContext()
    const [messageToSend, setMessageToSend] = useState("")
    const [token, setToken] = useState("")
    const chatState = useChatContext();
    const dispatchChatMessage = useChatDispatchContext()

    const submitMessage = () => {
        dispatchChatMessage({ type: "ADD_MESSAGE_TO_CHAT", message: messageToSend, contact:route.params.contact, isSent: true })
        setMessageToSend("")
    }
    return (
        <>
            <FlatList
                data={chatState.chat.filter(e => e.contact === route.params.contact).length > 0 ? chatState.chat.filter(e => e.contact === route.params.contact)[0].messages : []}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        key={item.message}
                        onPress={event => {}}>
                        <Text
                            style={{
                                alignSelf: item.isSent ? 'flex-end' : 'flex-start',
                                borderWidth: 1,
                                flexWrap: "wrap",
                                backgroundColor: item.isSent ? "#90EE90" : "white",
                                width: "70%",
                                borderRadius: 4,
                                padding: 10,
                                margin: 1
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