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
    Alert,
    Modal,
    ScrollView,
    ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";
import { useChatContext } from "../Contexts/ChatContext";
import { useChatServiceContext } from "../Contexts/ChatServiceContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logger from "../config/Logger";
import configs from "../config/AppConfig";
import { authenticatedFetch } from "../utils/AuthenticatedFetch";
import { getCurrentUserEmail } from "../utils/UserHelper";
import type { TransactionData, TransactionRole } from "../types/transaction.types";
import { buildTransactionMessage } from "../utils/transactionChat";
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

const MessageBubble = ({ item, getTimeFromTimestamp, contact }: any) => {
    // A message is sent by the current user if it's NOT from the contact
    // (either item.from is empty string for sent messages, or it's the current user's email)
    const isSent = item.from !== contact;
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

type PinnedTransaction = {
    transaction: TransactionData;
    role: TransactionRole;
};

const Chat = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const chatDispatch = useChatDispatchContext() as any;
    const [messageToSend, setMessageToSend] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const chatState = useChatContext() as any;
    const chatService = useChatServiceContext();
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastLoadedMessagesRef = useRef<number>(0);
    const transactionInitRef = useRef(false);
    const transactionFetchRef = useRef<string | null>(null);
    const contact = route.params?.contact || 'Chat';
    
    // Transaction list modal state
    const [showTransactionList, setShowTransactionList] = useState(false);
    const [allTransactions, setAllTransactions] = useState<TransactionData[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [statusFilterModal, setStatusFilterModal] = useState<'pending' | 'all'>('pending');
    const [dateFilterModal, setDateFilterModal] = useState<'all' | 'last7' | 'last30'>('all');
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    
    // Validate contexts are available
    useEffect(() => {
        if (!chatState || !chatDispatch) {
            Logger.error('CHAT', 'Missing required context providers!');
            Logger.error('CHAT', `chatState: ${!!chatState}, chatDispatch: ${!!chatDispatch}, chatService: ${!!chatService}`);
            Alert.alert(
                'Configuration Error',
                'Chat context is not properly initialized. Please restart the app.',
                [{ text: 'Go Back', onPress: () => navigation.goBack() }]
            );
        }

        // Load current user email
        getCurrentUserEmail().then((email: string | null) => {
            setCurrentUserEmail(email);
        });
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

    const pinnedTransaction = chatEntry?.pinnedTransaction as PinnedTransaction | undefined;

    const chatMessages = useMemo(() => {
        const messages = chatEntry?.messages || [];
        // Sort messages by timestamp in ascending order (oldest first)
        const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
        Logger.debug('CHAT', `Rendering ${sortedMessages.length} messages`);
        return sortedMessages;
    }, [chatEntry]);

    const isContactTyping = useMemo(() => {
        return chatEntry?.isTyping || false;
    }, [chatEntry?.isTyping]);

    const isContactOnline = useMemo(() => {
        return chatEntry?.isOnline || false;
    }, [chatEntry?.isOnline]);

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

    const setPinnedTransaction = useCallback((transaction: TransactionData, role: TransactionRole) => {
        if (!chatDispatch || !route.params?.contact) {
            return;
        }

        chatDispatch({
            type: 'SET_PINNED_TRANSACTION',
            contact: route.params.contact,
            transaction,
            role
        });
    }, [chatDispatch, route.params?.contact]);

    const updatePinnedTransactionStatus = useCallback((status: string) => {
        if (!chatDispatch || !route.params?.contact) {
            return;
        }

        chatDispatch({
            type: 'UPDATE_PINNED_TRANSACTION_STATUS',
            contact: route.params.contact,
            status
        });
    }, [chatDispatch, route.params?.contact]);

    const clearPinnedTransaction = useCallback(() => {
        if (!chatDispatch || !route.params?.contact) {
            return;
        }

        chatDispatch({
            type: 'CLEAR_PINNED_TRANSACTION',
            contact: route.params.contact
        });
    }, [chatDispatch, route.params?.contact]);

    const normalizeTransaction = useCallback((entry: any): TransactionData => {
        return {
            id: String(entry.id ?? entry.transactionId ?? ''),
            itemId: entry.itemId ?? entry.item?.id,
            buyerName: entry.customerName ?? entry.buyerName ?? entry.buyer?.name,
            buyerEmail: entry.customerEmail ?? entry.buyerEmail ?? entry.buyer?.email,
            sellerName: entry.sellerName ?? entry.seller?.name,
            sellerEmail: entry.sellerEmail ?? entry.seller?.email,
            quantityOrdered: entry.quantityOrdered ?? entry.quantity ?? entry.amount,
            unit: entry.unit ?? entry.item?.unit,
            totalPrice: entry.totalPrice ?? entry.total ?? entry.totalAmount,
            status: entry.status ?? 'UNKNOWN',
            notes: entry.notes ?? entry.note,
            createdAt: entry.createdAt ?? entry.createdDate ?? entry.created,
            updatedAt: entry.updatedAt ?? entry.updatedDate ?? entry.updated,
        };
    }, []);

    const fetchTransactionsBetweenUsers = useCallback(async (contactEmail: string, statusFilter?: string) => {
        try {
            let url = `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_BETWEEN_USERS_PATH}?otherUserEmail=${encodeURIComponent(contactEmail)}`;
            if (statusFilter) {
                url += `&status=${statusFilter}`;
            }

            Logger.info('TRANSACTION', `Fetching transactions between users: ${url}`);
            Logger.request(url, 'GET');

            const response = await authenticatedFetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            Logger.response(url, response.status);

            if (!response.ok) {
                throw new Error('Failed to fetch transactions between users');
            }

            const data = await response.json();
            const rawTransactions = Array.isArray(data)
                ? data
                : data.items || data.transactions || data.content || [];

            const normalized = rawTransactions.map(normalizeTransaction);
            return normalized;
        } catch (error) {
            Logger.error('TRANSACTION', 'Failed to load transactions between users', error);
            return [];
        }
    }, [normalizeTransaction]);

    const fetchTransactionsForContact = useCallback(async (contactEmail: string) => {
        try {
            const urls = [
                `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_SELLER_MY_SALES_PATH}`,
                `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_CUSTOMER_MY_ORDERS_PATH}`
            ];

            const responses = await Promise.all(
                urls.map((url) =>
                    authenticatedFetch(url, {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json'
                        }
                    }).catch((error) => {
                        Logger.error('TRANSACTION', 'Failed to fetch transactions', error);
                        return null;
                    })
                )
            );

            const payloads = await Promise.all(
                responses.map(async (response) => {
                    if (!response || !response.ok) {
                        return [];
                    }
                    try {
                        const data = await response.json();
                        return Array.isArray(data)
                            ? data
                            : data.items || data.transactions || data.content || [];
                    } catch {
                        return [];
                    }
                })
            );

            const merged = payloads.flat().map(normalizeTransaction);
            const related = merged.filter((transaction) => {
                const buyerEmail = transaction.buyerEmail?.toLowerCase();
                const sellerEmail = transaction.sellerEmail?.toLowerCase();
                const target = contactEmail.toLowerCase();
                return buyerEmail === target || sellerEmail === target;
            });

            if (related.length === 0) {
                return;
            }

            const sorted = related.sort((a, b) => {
                const left = a.updatedAt ?? a.createdAt ?? '';
                const right = b.updatedAt ?? b.createdAt ?? '';
                return new Date(right).getTime() - new Date(left).getTime();
            });

            const latest = sorted[0];
            const role: TransactionRole = latest.buyerEmail?.toLowerCase() === contactEmail.toLowerCase()
                ? 'seller'
                : 'buyer';

            setPinnedTransaction(latest, role);
        } catch (error) {
            Logger.error('TRANSACTION', 'Failed to load chat transactions', error);
        }
    }, [normalizeTransaction, setPinnedTransaction]);

    const handleTransactionAction = useCallback(async (status: 'CONFIRMED' | 'REJECTED') => {
        if (!pinnedTransaction?.transaction?.id) {
            return;
        }

        try {
            const url = `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_STATUS_PATH(pinnedTransaction.transaction.id)}`;
            Logger.info('TRANSACTION', `Updating transaction ${pinnedTransaction.transaction.id} to ${status}`);
            Logger.request(url, 'PUT', { status });

            const response = await authenticatedFetch(url, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status })
            });

            Logger.response(url, response.status);

            if (!response.ok) {
                Alert.alert('Transaction update failed', 'Please try again.');
                return;
            }

            updatePinnedTransactionStatus(status);

            if (chatService && route.params?.contact) {
                const updated = {
                    ...pinnedTransaction.transaction,
                    status
                };
                chatService.sendMessage(
                    route.params.contact,
                    buildTransactionMessage(updated, 'buyer'),
                    String(uuid.v4())
                );
            }
        } catch (error) {
            Logger.error('TRANSACTION', 'Failed to update transaction status', error);
            Alert.alert('Transaction update failed', 'Please try again.');
        }
    }, [chatService, pinnedTransaction?.transaction, route.params?.contact, updatePinnedTransactionStatus]);

    const handleCancelTransaction = useCallback(async () => {
        if (!pinnedTransaction?.transaction?.id) {
            return;
        }

        try {
            const url = `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_STATUS_PATH(pinnedTransaction.transaction.id)}`;
            Logger.info('TRANSACTION', `Cancelling transaction ${pinnedTransaction.transaction.id}`);
            Logger.request(url, 'PUT', { status: 'CANCELLED' });

            const response = await authenticatedFetch(url, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'CANCELLED' })
            });

            Logger.response(url, response.status);

            if (!response.ok) {
                Alert.alert('Transaction update failed', 'Please try again.');
                return;
            }

            updatePinnedTransactionStatus('CANCELLED');

            if (chatService && route.params?.contact) {
                const updated = {
                    ...pinnedTransaction.transaction,
                    status: 'CANCELLED'
                };
                chatService.sendMessage(
                    route.params.contact,
                    buildTransactionMessage(updated, 'buyer'),
                    String(uuid.v4())
                );
            }
        } catch (error) {
            Logger.error('TRANSACTION', 'Failed to cancel transaction', error);
            Alert.alert('Transaction update failed', 'Please try again.');
        }
    }, [chatService, pinnedTransaction?.transaction, route.params?.contact, updatePinnedTransactionStatus]);

    const handleDeleteTransaction = useCallback(async () => {
        if (!pinnedTransaction?.transaction?.id) {
            return;
        }

        try {
            const url = `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_BASE_PATH}/${pinnedTransaction.transaction.id}`;
            Logger.info('TRANSACTION', `Deleting transaction ${pinnedTransaction.transaction.id}`);
            Logger.request(url, 'DELETE');

            const response = await authenticatedFetch(url, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json'
                }
            });

            Logger.response(url, response.status);

            if (!response.ok && response.status !== 204) {
                Alert.alert('Transaction update failed', 'Please try again.');
                return;
            }

            clearPinnedTransaction();

            if (chatService && route.params?.contact) {
                chatService.sendMessage(
                    route.params.contact,
                    buildTransactionMessage(
                        { ...pinnedTransaction.transaction, status: 'REJECTED' },
                        'buyer'
                    ),
                    String(uuid.v4())
                );
            }
        } catch (error) {
            Logger.error('TRANSACTION', 'Failed to delete transaction', error);
            Alert.alert('Transaction update failed', 'Please try again.');
        }
    }, [chatService, clearPinnedTransaction, pinnedTransaction?.transaction, route.params?.contact]);

    useEffect(() => {
        const incomingTransaction = route.params?.transaction as TransactionData | undefined;
        const role = (route.params?.transactionRole as TransactionRole | undefined) || 'buyer';

        if (!incomingTransaction || !route.params?.contact || transactionInitRef.current) {
            return;
        }

        transactionInitRef.current = true;
        setPinnedTransaction(incomingTransaction, role);

        if (role === 'buyer' && chatService) {
            chatService.sendMessage(
                route.params.contact,
                buildTransactionMessage(incomingTransaction, 'seller'),
                String(uuid.v4())
            );
        }
    }, [chatService, route.params?.contact, route.params?.transaction, route.params?.transactionRole, setPinnedTransaction]);

    const loadTransactionListForModal = useCallback(async () => {
        if (!route.params?.contact) return;

        setLoadingTransactions(true);
        try {
            // Fetch all transactions without status filter (API doesn't support status filtering)
            const transactions = await fetchTransactionsBetweenUsers(
                route.params.contact,
                undefined
            );
            setAllTransactions(transactions);
        } catch (error) {
            Logger.error('TRANSACTION', 'Failed to load transaction list', error);
        } finally {
            setLoadingTransactions(false);
        }
    }, [route.params?.contact, fetchTransactionsBetweenUsers]);

    const openTransactionListModal = useCallback(() => {
        setShowTransactionList(true);
    }, []);

    useEffect(() => {
        if (showTransactionList) {
            loadTransactionListForModal();
        }
    }, [showTransactionList, loadTransactionListForModal]);

    const filteredModalTransactions = useMemo(() => {
        // Deduplicate transactions by ID
        const uniqueTransactions = allTransactions.reduce((acc, transaction) => {
            if (!acc.find(t => t.id === transaction.id)) {
                acc.push(transaction);
            }
            return acc;
        }, [] as TransactionData[]);

        let filtered = [...uniqueTransactions];

        // Apply status filter (client-side since API doesn't support it)
        if (statusFilterModal === 'pending') {
            filtered = filtered.filter(t => t.status === 'PENDING');
        }
        // 'all' means no status filter

        // Apply date filter
        if (dateFilterModal !== 'all') {
            const now = Date.now();
            const daysMs = dateFilterModal === 'last7' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
            filtered = filtered.filter(t => {
                const createdAt = t.createdAt ? new Date(t.createdAt).getTime() : 0;
                return now - createdAt <= daysMs;
            });
        }

        // Sort by date descending (newest first)
        filtered.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return filtered;
    }, [allTransactions, dateFilterModal, statusFilterModal]);

    useEffect(() => {
        if (!chatService || !route.params?.contact) {
            return;
        }

        if (pinnedTransaction?.transaction) {
            return;
        }

        if (transactionFetchRef.current === route.params.contact) {
            return;
        }

        transactionFetchRef.current = route.params.contact;
        fetchTransactionsForContact(route.params.contact);
    }, [chatService, fetchTransactionsForContact, pinnedTransaction?.transaction, route.params?.contact]);

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
            <View style={{ flex: 1, backgroundColor: 'rgba(217, 242, 217, 0.85)' }}>
                {/* Custom Header with Online Status */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingBottom: 12,
                    backgroundColor: 'rgba(217, 242, 217, 0.85)',
                    borderBottomWidth: 1,
                    borderBottomColor: '#c5bebeff'
                }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("ContactsList")}
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
                    <TouchableOpacity
                        onPress={openTransactionListModal}
                        style={{
                            padding: 8,
                            backgroundColor: '#2196F3',
                            borderRadius: 8,
                        }}
                    >
                        <Ionicons name="receipt-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
                
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 30}
                >
                    {pinnedTransaction?.transaction && pinnedTransaction.transaction.status === 'PENDING' ? (
                        <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
                            <View style={{
                                backgroundColor: '#fff',
                                borderRadius: 12,
                                padding: 14,
                                borderLeftWidth: 4,
                                borderLeftColor: '#2196F3',
                                shadowColor: '#000',
                                shadowOpacity: 0.06,
                                shadowRadius: 2,
                                shadowOffset: { width: 0, height: 1 },
                            }}>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Pinned transaction</Text>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 }}>
                                    {pinnedTransaction.transaction.id}
                                </Text>
                                <Text style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                                    Status: {pinnedTransaction.transaction.status}
                                </Text>
                                <Text style={{ fontSize: 13, color: '#666' }}>
                                    Quantity: {pinnedTransaction.transaction.quantityOrdered ?? '-'} {pinnedTransaction.transaction.unit ?? ''}
                                </Text>
                                {pinnedTransaction.role === 'seller' && (
                                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                                        <TouchableOpacity
                                            onPress={() => handleTransactionAction('CONFIRMED')}
                                            style={{
                                                flex: 1,
                                                backgroundColor: '#4caf50',
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                                marginRight: 8,
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleDeleteTransaction}
                                            style={{
                                                flex: 1,
                                                backgroundColor: '#f44336',
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Decline</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    ) : null}
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
                                    contact={contact}
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
                            backgroundColor: "rgba(217, 242, 217, 0.85)",
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

            {/* Transaction List Modal */}
            <Modal
                visible={showTransactionList}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowTransactionList(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'flex-end'
                }}>
                    <View style={{
                        backgroundColor: '#fff',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        maxHeight: '80%',
                        paddingBottom: insets.bottom
                    }}>
                        {/* Modal Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: '#eee'
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>
                                Transactions
                            </Text>
                            <TouchableOpacity onPress={() => setShowTransactionList(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {/* Filters */}
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                            {/* Status Filter */}
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: '600' }}>
                                Status
                            </Text>
                            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                                <TouchableOpacity
                                    onPress={() => setStatusFilterModal('pending')}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        backgroundColor: statusFilterModal === 'pending' ? '#2196F3' : '#e0e0e0',
                                        borderRadius: 16,
                                        marginRight: 8
                                    }}
                                >
                                    <Text style={{
                                        color: statusFilterModal === 'pending' ? '#fff' : '#333',
                                        fontWeight: '600',
                                        fontSize: 13
                                    }}>
                                        Pending
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setStatusFilterModal('all')}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        backgroundColor: statusFilterModal === 'all' ? '#2196F3' : '#e0e0e0',
                                        borderRadius: 16
                                    }}
                                >
                                    <Text style={{
                                        color: statusFilterModal === 'all' ? '#fff' : '#333',
                                        fontWeight: '600',
                                        fontSize: 13
                                    }}>
                                        Show All
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Date Filter */}
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: '600' }}>
                                Date Range
                            </Text>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity
                                    onPress={() => setDateFilterModal('all')}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        backgroundColor: dateFilterModal === 'all' ? '#2196F3' : '#e0e0e0',
                                        borderRadius: 16,
                                        marginRight: 8
                                    }}
                                >
                                    <Text style={{
                                        color: dateFilterModal === 'all' ? '#fff' : '#333',
                                        fontWeight: '600',
                                        fontSize: 13
                                    }}>
                                        All Time
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setDateFilterModal('last7')}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        backgroundColor: dateFilterModal === 'last7' ? '#2196F3' : '#e0e0e0',
                                        borderRadius: 16,
                                        marginRight: 8
                                    }}
                                >
                                    <Text style={{
                                        color: dateFilterModal === 'last7' ? '#fff' : '#333',
                                        fontWeight: '600',
                                        fontSize: 13
                                    }}>
                                        Last 7 Days
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setDateFilterModal('last30')}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        backgroundColor: dateFilterModal === 'last30' ? '#2196F3' : '#e0e0e0',
                                        borderRadius: 16
                                    }}
                                >
                                    <Text style={{
                                        color: dateFilterModal === 'last30' ? '#fff' : '#333',
                                        fontWeight: '600',
                                        fontSize: 13
                                    }}>
                                        Last 30 Days
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Transaction List */}
                        {loadingTransactions ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#2196F3" />
                                <Text style={{ marginTop: 12, color: '#666' }}>Loading transactions...</Text>
                            </View>
                        ) : filteredModalTransactions.length === 0 ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <Ionicons name="receipt-outline" size={48} color="#ccc" />
                                <Text style={{ marginTop: 12, color: '#666', fontSize: 16 }}>
                                    No transactions found
                                </Text>
                            </View>
                        ) : (
                            <ScrollView style={{ maxHeight: 400 }}>
                                {filteredModalTransactions.map((transaction) => {
                                    const isPending = transaction.status === 'PENDING';
                                    const isSeller = transaction.sellerEmail === currentUserEmail;

                                    return (
                                        <View
                                            key={transaction.id}
                                            style={{
                                                backgroundColor: '#f9f9f9',
                                                marginHorizontal: 16,
                                                marginVertical: 8,
                                                borderRadius: 12,
                                                padding: 14,
                                                borderLeftWidth: 4,
                                                borderLeftColor: isPending ? '#ff9800' : '#4caf50'
                                            }}
                                        >
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 8
                                            }}>
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', flex: 1 }}>
                                                    #{transaction.id}
                                                </Text>
                                                <Text style={{
                                                    fontSize: 11,
                                                    fontWeight: '600',
                                                    color: '#fff',
                                                    backgroundColor: isPending ? '#ff9800' : '#4caf50',
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 4,
                                                    borderRadius: 4
                                                }}>
                                                    {transaction.status}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                                                {isSeller ? 'Buyer' : 'Seller'}: {isSeller ? transaction.buyerName : transaction.sellerName}
                                            </Text>
                                            <Text style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                                                Quantity: <Text style={{ fontWeight: '600' }}>{transaction.quantityOrdered} {transaction.unit}</Text>
                                            </Text>
                                            <Text style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                                                Total: <Text style={{ fontWeight: '600', color: '#2196F3' }}>€{transaction.totalPrice}</Text>
                                            </Text>
                                            <Text style={{ fontSize: 11, color: '#999' }}>
                                                {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </Text>

                                            {/* Action buttons for pending transactions */}
                                            {isPending && isSeller && (
                                                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                                                    <TouchableOpacity
                                                        onPress={async () => {
                                                            try {
                                                                const url = `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_STATUS_PATH(transaction.id)}`;
                                                                const response = await authenticatedFetch(url, {
                                                                    method: 'PUT',
                                                                    headers: {
                                                                        Accept: 'application/json',
                                                                        'Content-Type': 'application/json',
                                                                    },
                                                                    body: JSON.stringify({ status: 'CONFIRMED' })
                                                                });
                                                                if (response.ok) {
                                                                    loadTransactionListForModal();
                                                                    Alert.alert('Success', 'Transaction confirmed');
                                                                }
                                                            } catch (error) {
                                                                Alert.alert('Error', 'Failed to confirm transaction');
                                                            }
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: '#4caf50',
                                                            paddingVertical: 8,
                                                            borderRadius: 8,
                                                            marginRight: 8,
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                                                            Accept
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={async () => {
                                                            try {
                                                                const url = `${configs.USER_AUTH_BASE_URL}/api/v1/transactions/${transaction.id}`;
                                                                const response = await authenticatedFetch(url, {
                                                                    method: 'DELETE'
                                                                });
                                                                if (response.ok) {
                                                                    loadTransactionListForModal();
                                                                    Alert.alert('Success', 'Transaction declined');
                                                                }
                                                            } catch (error) {
                                                                Alert.alert('Error', 'Failed to decline transaction');
                                                            }
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: '#f44336',
                                                            paddingVertical: 8,
                                                            borderRadius: 8,
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                                                            Decline
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
};

export default Chat;