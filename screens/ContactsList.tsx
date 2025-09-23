import React, { MutableRefObject, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from "react";
import { Alert, Button, FlatList, GestureResponderEvent, Text, TextInput, TouchableOpacity, View, Modal } from "react-native";
import ContactsContext from "../Contexts/ContactsContext";
import * as SecureStore from 'expo-secure-store'
import ContactsListStyles from "../styles/ContactsListStyles";
import configs from "../config/AppConfig";
import { useChatContext } from "../Contexts/ChatContext";
import ContactsListStyle from "../styles/ContactsListStyles";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";

import type { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, type RouteProp } from '@react-navigation/native';
import contactsContext from "../Contexts/ContactsContext";

type ContactsListProps = {
    navigation: StackNavigationProp<any>;
    route: RouteProp<any>;
};

const ContactsList = ({ navigation, route }: ContactsListProps) => {
    // TODO implement a better typings
    const [contactToAdd, setContactToAdd] = useState("");
    const [token, setToken] = useState<string | null>("")
    interface ChatState {
        chat: ChatItem[];
        // add other properties if needed
    }

    const chatState = useChatContext() as unknown as ChatState;
    const chatDispatch = useChatDispatchContext();

    if (!chatDispatch) {
        throw new Error("Chat dispatch context is not available");
    }

    // works but keeps reconnecting const socket = io("http://192.168.1.21:3000")
    interface Friend {
        email: string;
        userName?: string;
        // add other friend properties if needed
    }

    interface ContactsListState {
        ContactsList: Friend[];
        message: string | null;
        chat: any[]; // Replace 'any' with a more specific type if available
    }

    interface FriendAddedAction {
        type: 'FRIEND_ADDED';
        friend: Friend;
    }

    interface FriendRemovedAction {
        type: 'FRIEND_REMOVED';
        friend?: Friend;
    }

    interface ContactsListGatheredAction {
        type: 'FRIENDS_LIST_GATHERED';
        ContactsList: Friend[];
    }

    type ContactsListAction =
        | FriendAddedAction
        | FriendRemovedAction
        | ContactsListGatheredAction;

    const [state, dispatch] = useReducer(
        (prevState: ContactsListState, action: ContactsListAction): ContactsListState => {
            switch (action.type) {
                case 'FRIEND_ADDED':
                    return {
                        ...prevState,
                        ContactsList: [...prevState.ContactsList, action.friend]
                    }
                case 'FRIEND_REMOVED':
                    return {
                        ...prevState,
                        ContactsList: prevState.ContactsList.filter(e => e.userName != action.friend?.userName)
                    }
                case 'FRIENDS_LIST_GATHERED':
                    return {
                        ...prevState,
                        ContactsList: action.ContactsList
                    }
                default:
                    return prevState;
            }
        },
        {
            ContactsList: [],
            message: null,
            chat: []
        } as ContactsListState
    );

    useFocusEffect(
        useCallback(() => {
            const getContactsList = async () => {
                console.log(`ContactsList getContactsList called`)
                const token = await SecureStore.getItemAsync("userToken");
                setToken(token)
                console.log(`Sending request to get ContactsList with token ${JSON.stringify(token)}`)
                await fetch(configs.USER_AUTH_BASE_URL + configs.USER_AUTH_CONTACTS_LIST_PATH, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token
                    },
                    body: null,
                })
                    .then(async response => {
                        const jsonResponse = await response.json();
                        console.log(`received response from server ${JSON.stringify(jsonResponse)}`)
                        if (response.status !== 200) {
                            Alert.alert(
                                'issue with the friends list',
                                'We are sorry but something went wrong with \n the friends list call to backend.. please try it later!',
                                [{ text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel' }])
                        }
                        else {
                            console.log("received data from server for friends list: " + JSON.stringify(jsonResponse))
                            dispatch({ type: 'FRIENDS_LIST_GATHERED', ContactsList: jsonResponse.friends });
                        }
                        console.log(`Calling socket IO`)

                    })
                    .catch(e => {
                        Alert.alert(
                            'Registration issue',
                            'We are sorry but something went wrong with \n the registration.. please try it later!',
                            [{ text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel' }])
                        console.log(`some error occured while calling ContactsList request${e}`)
                    })
            }
            getContactsList()
        }, [])
    );

    const friendsContext = useMemo(() => {

    }, [])

    // Popup state
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [newContactEmail, setNewContactEmail] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Email validation function
    const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleAddContact = () => {
        setShowAddContactModal(true);
        setNewContactEmail("");
        setIsEmailValid(false);
    }

    const handleCancelAddContact = () => {
        setShowAddContactModal(false);
        setNewContactEmail("");
        setIsEmailValid(false);
    }

    const handleEmailInputChange = (text: string) => {
        setNewContactEmail(text);
        setIsEmailValid(validateEmail(text));
    };

    const sendAContactRequest = async () => {
        setIsSending(true);
        try {
            const token = await SecureStore.getItemAsync("userToken");
            const response = await fetch(
                `${configs.USER_AUTH_BASE_URL}${configs.USER_AUTH_ADD_CONTACT_PATH}?email=${encodeURIComponent(newContactEmail)}`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    body: null,
                }
            );
            if (!response.ok) {
                Alert.alert(
                    "Contact request issue",
                    "Something went wrong with the contact request. Please try again later.",
                    [{ text: "Ok", style: "cancel" }]
                );
            } else {
                Alert.alert(
                    "Contact request sent",
                    "Your contact request has been sent.",
                    [{
                        text: "Ok",
                        onPress: () => {
                            setShowAddContactModal(false); // <-- Ensure modal closes after alert
                            setNewContactEmail("");
                            setIsEmailValid(false);
                        }
                    }]
                );
                // Also close the modal immediately in case the user doesn't press OK
                setShowAddContactModal(false);
                setNewContactEmail("");
                setIsEmailValid(false);
            }
        } catch (e) {
            Alert.alert(
                "Contact request issue",
                "Something went wrong with the contact request. Please try again later.",
                [{ text: "Ok", style: "cancel" }]
            );
        } finally {
            setIsSending(false);
        }
    };

    interface Message {
        read: boolean;
        // add other message properties if needed
    }

    interface ChatItem {
        contact: string;
        messages: Message[];
        // add other chat item properties if needed
    }

    const getNumberOfUnreadMessagesByChat = (chat: ChatItem[]): number => {
        console.debug("ContactsList -- getNumberOfUnreadMessagesByChat -- for: " + JSON.stringify(chat))
        if (chat == null || chat.length == 0) {
            return 0
        }
        else {
            const unreadMessages = chat[0].messages.filter((e: Message) => e.read == false)
            return unreadMessages.length
        }
    }

    interface SetMessagesToReadAction {
        type: 'SET_MESSAGES_TO_READ';
        email: string;
    }

    const setMessagesToRead = (email: string): void => {
        console.debug("ContactsList -- setMessagesToRead -- " + email)
        if (chatDispatch) {
            chatDispatch({type: 'SET_MESSAGES_TO_READ', email: email} as SetMessagesToReadAction)
        }
    }

    return (
        <ContactsContext.Provider value={contactsContext}>
            <FlatList
                data={state.ContactsList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        key={item.email}
                        onPress={event => {
                            // socket.current?.removeListener("private-message-from-server", socketPrivateMessageCB)
                            setMessagesToRead(item.email)
                            navigation.navigate("Chat", { title: `Chat with ${item.email}`, contact: item.email })
                            //navigation.navigate("Chat", {contact: item.email, title: `Chat with ${item.email}`})
                        }}
                        style={ContactsListStyles.friendBox}>
                        <Text
                            style={ContactsListStyle.contactEmailStyle}>
                            {item.email}
                        </Text>
                        {chatState && getNumberOfUnreadMessagesByChat(chatState.chat.filter(e => e.contact == item.email)) == 0 ? 
                        null : chatState && <Text
                        style={ContactsListStyle.unreadMessagesNumber}>
                        {getNumberOfUnreadMessagesByChat(chatState ? chatState.chat.filter(e => e.contact == item.email) : [])}
                    </Text>}
                        
                    </TouchableOpacity>)}>
            </FlatList>
            <Button
                title="Add a friend"
                onPress={handleAddContact}
                disabled={false}
            />

            {/* Add Contact Modal */}
            <Modal
                visible={showAddContactModal}
                transparent
                animationType="slide"
                onRequestClose={handleCancelAddContact}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <View style={{
                        backgroundColor: "white",
                        padding: 24,
                        borderRadius: 12,
                        width: "80%",
                        alignItems: "center"
                    }}>
                        <Text style={{ fontSize: 18, marginBottom: 12 }}>Add a contact</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 6,
                                padding: 8,
                                width: "100%",
                                marginBottom: 12
                            }}
                            placeholder="Enter contact's email"
                            value={newContactEmail}
                            onChangeText={handleEmailInputChange}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoFocus
                        />
                        {!isEmailValid && newContactEmail.length > 0 && (
                            <Text style={{ color: "red", marginBottom: 8 }}>Invalid email address</Text>
                        )}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                            <Button
                                title="Cancel"
                                onPress={handleCancelAddContact}
                                color="#888"
                                disabled={isSending}
                            />
                            <View style={{ width: 16 }} />
                            <Button
                                title={isSending ? "Sending..." : "Send"}
                                onPress={sendAContactRequest}
                                disabled={!isEmailValid || isSending}
                                color={isEmailValid ? "#2196F3" : "#ccc"}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </ContactsContext.Provider>

    );
}

export default ContactsList;