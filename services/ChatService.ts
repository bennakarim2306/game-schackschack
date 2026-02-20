import { Socket, io } from 'socket.io-client';
import Logger from '../config/Logger';
import configs from '../config/AppConfig';

export interface MessageStatusReceipt {
    messageId: string;
    deliveredAt?: number;
    readAt?: number;
}

export interface ConversationHistoryData {
    with: string;
    messages: any[];
    hasMore: boolean;
    offset: number;
    limit: number;
}

export interface UnreadCountsData {
    counts: { [email: string]: number };
    total: number;
}

export interface OnlineStatusData {
    status: { [email: string]: boolean };
}

export class ChatService {
    private socket: Socket | null = null;
    private token: string = '';
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private typingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

    constructor() {
        Logger.info('CHATSERVICE', 'ChatService instantiated');
    }

    /**
     * Initialize socket connection and setup all listeners
     */
    public async initialize(jwtToken: string, callbacks: ChatServiceCallbacks): Promise<void> {
        this.token = jwtToken;

        try {
            Logger.info('CHATSERVICE', `Connecting to: ${configs.WEBSOCKER_BASE_URL}`);

            this.socket = io(configs.WEBSOCKER_BASE_URL, {
                path: '/socket/io',
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                auth: {
                    token: jwtToken
                }
            });

            // Connection handlers
            this.socket.on('connect', () => {
                Logger.success('CHATSERVICE', 'Connected to WebSocket server');
                this.registerClient();
                this.startHeartbeat();
            });

            this.socket.on('disconnect', (reason: string) => {
                Logger.warning('CHATSERVICE', `Disconnected: ${reason}`);
                this.stopHeartbeat();
                if (callbacks.onDisconnect) {
                    callbacks.onDisconnect(reason);
                }
            });

            this.socket.on('connect_error', (error: any) => {
                const errorMessage = error?.message || error?.toString() || 'Unknown connection error';
                Logger.error('CHATSERVICE', 'Connection error:', errorMessage);
                
                // Check if it's an authentication error
                if (errorMessage.includes('Authentication')) {
                    Logger.error('CHATSERVICE', 'Socket authentication failed - token may be invalid or expired');
                }
                
                if (callbacks.onConnectionError) {
                    callbacks.onConnectionError(error);
                }
            });

            // Registration
            this.socket.on('register-server', (response: string) => {
                Logger.success('CHATSERVICE', 'Client registered:', response);
                if (callbacks.onRegistrationSuccess) {
                    callbacks.onRegistrationSuccess(response);
                }
            });

            // Message sending acknowledgment
            this.socket.on('message-sent-ack', (data: { messageId: string; to: string; timestamp: number }) => {
                Logger.debug('CHATSERVICE', `Message sent ACK: ${data.messageId}`);
                if (callbacks.onMessageSentAck) {
                    callbacks.onMessageSentAck(data);
                }
            });

            // Incoming messages
            this.socket.on('private-message-from-server', (data: any) => {
                Logger.info('CHATSERVICE', `Message from ${data.from}:`, data.message);
                if (callbacks.onMessageReceived) {
                    callbacks.onMessageReceived(data);
                }
            });

            // Message delivery receipt
            this.socket.on('message-delivered-receipt', (data: MessageStatusReceipt) => {
                Logger.debug('CHATSERVICE', `Message delivered: ${data.messageId}`);
                if (callbacks.onMessageDelivered) {
                    callbacks.onMessageDelivered(data);
                }
            });

            // Message read receipt
            this.socket.on('message-read-receipt', (data: MessageStatusReceipt) => {
                Logger.debug('CHATSERVICE', `Message read: ${data.messageId}`);
                if (callbacks.onMessageRead) {
                    callbacks.onMessageRead(data);
                }
            });

            // Conversation history
            this.socket.on('conversation-history', (data: ConversationHistoryData) => {
                Logger.debug('CHATSERVICE', `Received conversation history with ${data.messages?.length || 0} messages`);
                if (callbacks.onConversationHistory) {
                    callbacks.onConversationHistory(data);
                }
            });

            // Unread counts
            this.socket.on('unread-counts', (data: UnreadCountsData) => {
                Logger.debug('CHATSERVICE', `Unread counts received: ${data.total} total`);
                if (callbacks.onUnreadCounts) {
                    callbacks.onUnreadCounts(data);
                }
            });

            // Typing indicators
            this.socket.on('user-typing', (data: { from: string; isTyping: boolean }) => {
                Logger.debug('CHATSERVICE', `User typing: ${data.from} - ${data.isTyping}`);
                if (callbacks.onUserTyping) {
                    callbacks.onUserTyping(data);
                }
            });

            // Online status
            this.socket.on('online-status', (data: OnlineStatusData) => {
                Logger.debug('CHATSERVICE', 'Online status received');
                if (callbacks.onOnlineStatus) {
                    callbacks.onOnlineStatus(data);
                }
            });

            Logger.success('CHATSERVICE', 'Socket initialization completed');
        } catch (error) {
            Logger.error('CHATSERVICE', 'Failed to initialize socket:', error);
            throw error;
        }
    }

    /**
     * Register client with the server
     */
    private registerClient(): void {
        if (!this.socket) return;

        Logger.info('CHATSERVICE', 'Registering client');
        this.socket.emit('register-client');
    }

    /**
     * Send a private message
     */
    public sendMessage(recipientEmail: string, messageText: string, messageId: string): void {
        if (!this.socket) {
            Logger.error('CHATSERVICE', 'Socket not initialized');
            return;
        }

        Logger.info('CHATSERVICE', `Sending message to ${recipientEmail}`);
        this.socket.emit('private-message', {
            to: recipientEmail,
            message: messageText,
            messageId: messageId
        });
    }

    /**
     * Load conversation history with pagination
     */
    public getConversationHistory(
        otherUserEmail: string,
        limit: number = 50,
        offset: number = 0
    ): void {
        if (!this.socket) {
            Logger.error('CHATSERVICE', 'Socket not initialized');
            return;
        }

        Logger.info('CHATSERVICE', `Loading conversation with ${otherUserEmail}, limit: ${limit}, offset: ${offset}`);
        this.socket.emit('get-conversation-history', {
            with: otherUserEmail,
            limit,
            offset
        });
    }

    /**
     * Mark a single message as delivered
     */
    public markMessageDelivered(messageId: string): void {
        if (!this.socket) {
            Logger.error('CHATSERVICE', 'Socket not initialized');
            return;
        }

        Logger.debug('CHATSERVICE', `Marking message as delivered: ${messageId}`);
        this.socket.emit('message-delivered', { messageId });
    }

    /**
     * Mark a single message as read
     */
    public markMessageRead(messageId: string): void {
        if (!this.socket) {
            Logger.error('CHATSERVICE', 'Socket not initialized');
            return;
        }

        Logger.debug('CHATSERVICE', `Marking message as read: ${messageId}`);
        this.socket.emit('message-read', { messageId });
    }

    /**
     * Mark multiple messages as read in bulk
     */
    public markMessagesAsRead(messageIds: string[]): void {
        if (!this.socket || messageIds.length === 0) {
            Logger.error('CHATSERVICE', 'Socket not initialized or no messageIds provided');
            return;
        }

        Logger.debug('CHATSERVICE', `Marking ${messageIds.length} messages as read`);
        this.socket.emit('mark-messages-read', { messageIds });
    }

    /**
     * Get unread message counts
     */
    public getUnreadCounts(): void {
        if (!this.socket) {
            Logger.error('CHATSERVICE', 'Socket not initialized');
            return;
        }

        Logger.debug('CHATSERVICE', 'Requesting unread counts');
        this.socket.emit('get-unread-counts');
    }

    /**
     * Send typing indicator
     */
    public sendTyping(recipientEmail: string): void {
        if (!this.socket) {
            Logger.error('CHATSERVICE', 'Socket not initialized');
            return;
        }

        Logger.debug('CHATSERVICE', `Sending typing indicator to ${recipientEmail}`);
        this.socket.emit('typing', {
            to: recipientEmail
        });

        // Clear previous timeout if exists
        const existingTimeout = this.typingTimeouts.get(recipientEmail);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Auto-stop typing after 3 seconds
        const timeout = setTimeout(() => {
            this.sendStopTyping(recipientEmail);
            this.typingTimeouts.delete(recipientEmail);
        }, 3000);

        this.typingTimeouts.set(recipientEmail, timeout);
    }

    /**
     * Stop sending typing indicator
     */
    public sendStopTyping(recipientEmail: string): void {
        if (!this.socket) {
            Logger.error('CHATSERVICE', 'Socket not initialized');
            return;
        }

        Logger.debug('CHATSERVICE', `Stopping typing indicator for ${recipientEmail}`);
        this.socket.emit('stop-typing', {
            to: recipientEmail
        });

        // Clear timeout
        const timeout = this.typingTimeouts.get(recipientEmail);
        if (timeout) {
            clearTimeout(timeout);
            this.typingTimeouts.delete(recipientEmail);
        }
    }

    /**
     * Check online status of multiple users
     */
    public checkOnlineStatus(userEmails: string[]): void {
        if (!this.socket) {
            Logger.error('CHATSERVICE', 'Socket not initialized');
            return;
        }

        Logger.debug('CHATSERVICE', `Checking online status for ${userEmails.length} users`);
        this.socket.emit('check-online-status', { userIds: userEmails });
    }

    /**
     * Start heartbeat to maintain online status
     */
    private startHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        Logger.debug('CHATSERVICE', 'Starting heartbeat');
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('heartbeat');
            }
        }, 20000); // 20 seconds
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            Logger.debug('CHATSERVICE', 'Stopping heartbeat');
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Disconnect socket
     */
    public disconnect(): void {
        Logger.info('CHATSERVICE', 'Disconnecting socket');
        this.stopHeartbeat();
        
        // Clear all typing timeouts
        this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.typingTimeouts.clear();

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Check if socket is connected
     */
    public isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}

export interface ChatServiceCallbacks {
    onRegistrationSuccess?: (response: string) => void;
    onMessageSentAck?: (data: { messageId: string; to: string; timestamp: number }) => void;
    onMessageReceived?: (data: any) => void;
    onMessageDelivered?: (data: MessageStatusReceipt) => void;
    onMessageRead?: (data: MessageStatusReceipt) => void;
    onConversationHistory?: (data: ConversationHistoryData) => void;
    onUnreadCounts?: (data: UnreadCountsData) => void;
    onUserTyping?: (data: { from: string; isTyping: boolean }) => void;
    onOnlineStatus?: (data: OnlineStatusData) => void;
    onDisconnect?: (reason: string) => void;
    onConnectionError?: (error: any) => void;
}
