import React, { MutableRefObject, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from "react";
import { Alert, Button, FlatList, GestureResponderEvent, Text, TextInput, TouchableOpacity, View, Modal } from "react-native";
import ContactsContext from "../Contexts/ContactsContext";
import * as SecureStore from 'expo-secure-store'
import ContactsListStyles from "../styles/ContactsListStyles";
import configs from "../config/AppConfig";
import { useChatContext } from "../Contexts/ChatContext";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";
import Logger from "../config/Logger";

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
                const token = await SecureStore.getItemAsync("userToken");
                setToken(token)
                
                const url = configs.USER_AUTH_BASE_URL + configs.USER_AUTH_CONTACTS_LIST_PATH;
                Logger.info('CONTACTS', 'Fetching contacts list');
                Logger.request(url, 'GET');
                
                await fetch(url, {
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
                        Logger.response(url, response.status, `Contacts: ${jsonResponse.friends?.length || 0}`);
                        
                        if (response.status !== 200) {
                            Logger.error('CONTACTS', 'Failed to get contacts list', jsonResponse);
                            Alert.alert(
                                'issue with the friends list',
                                'We are sorry but something went wrong with \n the friends list call to backend.. please try it later!',
                                [{ text: 'Ok', onPress: () => Logger.debug('CONTACTS', 'Alert dismissed'), style: 'cancel' }])
                        }
                        else {
                            Logger.success('CONTACTS', `Contacts list loaded - ${jsonResponse.friends?.length || 0} friends`);
                            dispatch({ type: 'FRIENDS_LIST_GATHERED', ContactsList: jsonResponse.friends });
                        }

                    })
                    .catch(e => {
                        Logger.error('CONTACTS', 'Exception getting contacts list', e);
                        Alert.alert(
                            'Registration issue',
                            'We are sorry but something went wrong with \n the registration.. please try it later!',
                            [{ text: 'Ok', onPress: () => Logger.debug('CONTACTS', 'Alert dismissed'), style: 'cancel' }])
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
            const url = `${configs.USER_AUTH_BASE_URL}${configs.USER_AUTH_ADD_CONTACT_PATH}?email=${encodeURIComponent(newContactEmail)}`;
            
            Logger.info('CONTACTS', `Sending contact request to: ${newContactEmail}`);
            Logger.request(url, 'POST');
            
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: null,
            });
            
            Logger.response(url, response.status);
            
            if (!response.ok) {
                Logger.error('CONTACTS', 'Contact request failed');
                Alert.alert(
                    "Contact request issue",
                    "Something went wrong with the contact request. Please try again later.",
                    [{ text: "Ok", style: "cancel" }]
                );
            } else {
                Logger.success('CONTACTS', `Contact request sent to ${newContactEmail}`);
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
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={ContactsListStyles.container}>
                <Text style={ContactsListStyles.header}>
                    Your Contacts
                </Text>
                <FlatList
                    data={state.ContactsList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            key={item.email}
                            onPress={event => {
                                Logger.info('CONTACTS', `Contact clicked: ${item.email}`);
                                setMessagesToRead(item.email)
                                Logger.debug('NAVIGATION', `Navigating to Chat with ${item.email}`);
                                navigation.navigate("Chat", { title: `Chat with ${item.email}`, contact: item.email })
                            }}
                            style={ContactsListStyles.contactCard}>
                            <View style={ContactsListStyles.avatar}>
                                <Text style={ContactsListStyles.avatarText}>
                                    {item.email[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={ContactsListStyles.contactEmail}>
                                    {item.email}
                                </Text>
                                {item.userName && (
                                    <Text style={ContactsListStyles.contactUserName}>
                                        {item.userName}
                                    </Text>
                                )}
                            </View>
                            {chatState && getNumberOfUnreadMessagesByChat(chatState.chat.filter(e => e.contact == item.email)) > 0 && (
                                <View style={ContactsListStyles.unreadBadge}>
                                    <Text style={ContactsListStyles.unreadBadgeText}>
                                        {getNumberOfUnreadMessagesByChat(chatState.chat.filter(e => e.contact == item.email))}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <Text style={ContactsListStyles.emptyText}>
                            No contacts found.
                        </Text>
                    }
                />
                <Button
                    title="Add a friend"
                    onPress={handleAddContact}
                    disabled={false}
                    color="#2196F3"
                />

                {/* Add Contact Modal */}
                <Modal
                    visible={showAddContactModal}
                    transparent
                    animationType="slide"
                    onRequestClose={handleCancelAddContact}
                >
                    <View style={ContactsListStyles.modalOverlay}>
                        <View style={ContactsListStyles.modalContainer}>
                            <Text style={ContactsListStyles.modalHeader}>
                                Add a contact
                            </Text>
                            <TextInput
                                style={ContactsListStyles.modalInput}
                                placeholder="Enter contact's email"
                                value={newContactEmail}
                                onChangeText={handleEmailInputChange}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoFocus
                            />
                            {!isEmailValid && newContactEmail.length > 0 && (
                                <Text style={ContactsListStyles.modalError}>Invalid email address</Text>
                            )}
                            <View style={ContactsListStyles.modalButtonRow}>
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
            </View>
            </View>
        </ContactsContext.Provider>

    );
}

export default ContactsList;