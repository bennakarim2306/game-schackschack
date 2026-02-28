import React, { MutableRefObject, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from "react";
import { Alert, Button, FlatList, GestureResponderEvent, Text, TextInput, TouchableOpacity, View, Modal } from "react-native";
import ContactsContext from "../Contexts/ContactsContext";
import * as SecureStore from 'expo-secure-store'
import ContactsListStyles from "../styles/ContactsListStyles";
import configs from "../config/AppConfig";
import { useChatContext } from "../Contexts/ChatContext";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";
import { useChatServiceContext } from "../Contexts/ChatServiceContext";
import Logger from "../config/Logger";
import { authenticatedFetch } from '../utils/AuthenticatedFetch';
import ScreenBackground from '../utils/ScreenBackground';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, type RouteProp } from '@react-navigation/native';
import contactsContext from "../Contexts/ContactsContext";

type ContactsListProps = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<any>;
};

const ContactsList = ({ navigation, route }: ContactsListProps) => {
    // TODO implement a better typings
    const [contactToAdd, setContactToAdd] = useState("");
    const [token, setToken] = useState<string | null>("")
    
    interface ChatItem {
        contact: string;
        messages: any[];
        unreadCount: number;
        isTyping: boolean;
        isOnline: boolean;
    }
    
    interface ChatState {
        chat: ChatItem[];
        totalUnread: number;
    }

    const chatState = useChatContext() as unknown as ChatState;
    const chatDispatch = useChatDispatchContext() as any;
    const chatService = useChatServiceContext();

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
                const url = configs.USER_AUTH_BASE_URL + configs.USER_AUTH_CONTACTS_LIST_PATH;
                Logger.info('CONTACTS', 'Fetching contacts list');
                Logger.request(url, 'GET');

                await authenticatedFetch(url, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
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

                            const emails = (jsonResponse.friends || [])
                                .map((friend: Friend) => friend.email)
                                .filter(Boolean);
                            if (chatService && emails.length > 0) {
                                chatService.checkOnlineStatus(emails);
                            }
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

    useEffect(() => {
        const autoOpenContact = (route.params as any)?.autoOpenContact;
        const transaction = (route.params as any)?.transaction;
        const transactionRole = (route.params as any)?.transactionRole;

        if (autoOpenContact && transaction) {
            navigation.navigate("Chat", {
                contact: autoOpenContact,
                transaction,
                transactionRole
            });
            navigation.setParams({
                autoOpenContact: undefined,
                transaction: undefined,
                transactionRole: undefined
            });
        }
    }, [navigation, route.params]);

    useEffect(() => {
        const emails = state.ContactsList
            .map((friend: Friend) => friend.email)
            .filter(Boolean);
        if (chatService && emails.length > 0) {
            chatService.checkOnlineStatus(emails);
        }
    }, [state.ContactsList, chatService]);

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
            const url = `${configs.USER_AUTH_BASE_URL}${configs.USER_AUTH_ADD_CONTACT_PATH}?email=${encodeURIComponent(newContactEmail)}`;

            Logger.info('CONTACTS', `Sending contact request to: ${newContactEmail}`);
            Logger.request(url, 'POST');

            const response = await authenticatedFetch(url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
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

    const getNumberOfUnreadMessagesByChat = (email: string): number => {
        if (!chatState?.chat) return 0;
        
        const chatEntry = chatState.chat.find((e: any) => e.contact === email);
        if (!chatEntry) return 0;
        
        return chatEntry.unreadCount || 0;
    }

    const getOnlineStatus = (email: string): boolean => {
        if (!chatState?.chat) return false;
        
        const chatEntry = chatState.chat.find((e: any) => e.contact === email);
        if (!chatEntry) return false;
        
        return chatEntry.isOnline || false;
    }

    const handleContactPress = (contactEmail: string) => {
        Logger.info('CONTACTS', `Contact clicked: ${contactEmail}`);
        
        // Clear unread count when opening chat
        if (chatDispatch) {
            chatDispatch({
                type: 'CLEAR_UNREAD_COUNT',
                contact: contactEmail
            });
        }
        
        Logger.debug('NAVIGATION', `Navigating to Chat with ${contactEmail}`);
        navigation.navigate("Chat", { title: `Chat with ${contactEmail}`, contact: contactEmail });
    }

    return (
        <ContactsContext.Provider value={null as any}>
            <ScreenBackground>
                <View style={ContactsListStyles.container}>
                    <FlatList
                        data={state.ContactsList}
                        extraData={chatState}
                        renderItem={({ item }) => {
                            const unreadCount = getNumberOfUnreadMessagesByChat(item.email);
                            const isOnline = getOnlineStatus(item.email);
                            
                            return (
                                <TouchableOpacity
                                    key={item.email}
                                    onPress={() => handleContactPress(item.email)}
                                    style={ContactsListStyles.contactCard}>
                                    <View style={ContactsListStyles.avatar}>
                                        <Text style={ContactsListStyles.avatarText}>
                                            {item.email[0].toUpperCase()}
                                        </Text>
                                        {/* Online indicator */}
                                        <View style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            width: 12,
                                            height: 12,
                                            borderRadius: 6,
                                            backgroundColor: isOnline ? '#4caf50' : '#ccc',
                                            borderWidth: 2,
                                            borderColor: 'white'
                                        }} />
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
                                    {/* Unread badge */}
                                    {unreadCount > 0 && (
                                        <View style={{
                                            backgroundColor: '#ff5722',
                                            borderRadius: 12,
                                            minWidth: 24,
                                            height: 24,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginLeft: 8
                                        }}>
                                            <Text style={{
                                                color: 'white',
                                                fontSize: 12,
                                                fontWeight: 'bold',
                                                paddingHorizontal: 6
                                            }}>
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <Text style={ContactsListStyles.emptyText}>
                                No contacts found.
                            </Text>
                        }
                    />
                    <TouchableOpacity
                        style={{
                            backgroundColor: "#2196F3",
                            borderRadius: 6,
                            paddingVertical: 12,
                            paddingHorizontal: 24,
                            justifyContent: "center",
                            alignItems: "center",
                            minHeight: 48
                        }}
                        onPress={handleAddContact}
                        disabled={false}
                    >
                        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                                                        Add Contact
                                                    </Text>
                    </TouchableOpacity>

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
            </ScreenBackground>
        </ContactsContext.Provider>

    );
}

export default ContactsList;