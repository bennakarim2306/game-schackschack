/**
 * Type definitions for the Foodopia Chat System
 * These types ensure type-safety across the chat implementation
 */

/**
 * Represents the status of a message through its lifecycle
 */
export interface MessageStatus {
  sent?: number;        // Timestamp when message was sent to server
  delivered?: number;   // Timestamp when message was delivered to recipient
  read?: number;        // Timestamp when message was read by recipient
}

/**
 * Represents a single chat message
 */
export interface ChatMessage {
  messageId: string;    // Unique UUID identifier
  from: string;         // Sender email (empty string if sent by current user)
  to: string;           // Recipient email (empty string if received)
  message: string;      // Message content
  timestamp: number;    // When message was created (milliseconds)
  status: MessageStatus;
}

/**
 * Represents a conversation with a contact
 */
export interface ChatEntry {
  contact: string;      // Contact email address
  messages: ChatMessage[];
  unreadCount: number;  // Number of unread messages from this contact
  isTyping: boolean;    // Whether contact is currently typing
  isOnline: boolean;    // Whether contact is currently online
}

/**
 * Root chat state in Redux/Context
 */
export interface ChatState {
  chat: ChatEntry[];
  totalUnread: number;  // Total unread messages across all contacts
}

/**
 * Actions that can be dispatched to modify chat state
 */
export type ChatAction =
  | AddMessageToChatAction
  | UpdateMessageStatusAction
  | SetConversationHistoryAction
  | SetTypingStatusAction
  | SetOnlineStatusAction
  | UpdateUnreadCountsAction
  | ClearUnreadCountAction
  | InitializeContactAction;

/**
 * Add a new message to chat
 */
export interface AddMessageToChatAction {
  type: 'ADD_MESSAGE_TO_CHAT';
  message: string;
  contact: string;
  isSent: boolean;
  timestamp: number;
  messageId: string;
}

/**
 * Update message delivery/read status
 */
export interface UpdateMessageStatusAction {
  type: 'UPDATE_MESSAGE_STATUS';
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: number;
}

/**
 * Load conversation history (bulk)
 */
export interface SetConversationHistoryAction {
  type: 'SET_CONVERSATION_HISTORY';
  contact: string;
  messages: ChatMessage[];
  unreadCount: number;
}

/**
 * Update typing indicator for contact
 */
export interface SetTypingStatusAction {
  type: 'SET_TYPING_STATUS';
  contact: string;
  isTyping: boolean;
}

/**
 * Update online status for contact
 */
export interface SetOnlineStatusAction {
  type: 'SET_ONLINE_STATUS';
  contact: string;
  isOnline: boolean;
}

/**
 * Update unread counts for multiple contacts
 */
export interface UpdateUnreadCountsAction {
  type: 'UPDATE_UNREAD_COUNTS';
  counts: { [contact: string]: number };
  total: number;
}

/**
 * Clear unread count for a contact
 */
export interface ClearUnreadCountAction {
  type: 'CLEAR_UNREAD_COUNT';
  contact: string;
}

/**
 * Pre-initialize a contact entry
 */
export interface InitializeContactAction {
  type: 'INITIALIZE_CONTACT';
  contact: string;
}

/**
 * Socket event data for message delivery receipt
 */
export interface MessageStatusReceipt {
  messageId: string;
  deliveredAt?: number;
  readAt?: number;
}

/**
 * Socket event data for conversation history
 */
export interface ConversationHistoryData {
  with: string;
  messages: ChatMessage[];
  hasMore: boolean;
  offset: number;
  limit: number;
}

/**
 * Socket event data for unread counts
 */
export interface UnreadCountsData {
  counts: { [email: string]: number };
  total: number;
}

/**
 * Socket event data for online status
 */
export interface OnlineStatusData {
  status: { [email: string]: boolean };
}

/**
 * Callbacks for ChatService events
 */
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

/**
 * Helper type for extracting contact email from ChatEntry
 */
export type ContactEmail = ChatEntry['contact'];

/**
 * Helper type for message direction
 */
export type MessageDirection = 'sent' | 'received';

/**
 * Helper type for message status state
 */
export type MessageStatusState = 'pending' | 'sent' | 'delivered' | 'read';

/**
 * Request types for ChatService methods
 */
export interface GetConversationHistoryRequest {
  token: string;
  with: string;
  limit?: number;
  offset?: number;
}

export interface PrivateMessageRequest {
  token: string;
  to: string;
  message: string;
  messageId: string;
}

export interface MarkMessagesReadRequest {
  token: string;
  messageIds: string[];
}

export interface GetUnreadCountsRequest {
  token: string;
}

export interface TypingRequest {
  token: string;
  to: string;
}

export interface CheckOnlineStatusRequest {
  userIds: string[];
}

export interface HeartbeatRequest {
  token: string;
}

/**
 * Utility types for working with chat data
 */

/**
 * Get all unread messages across all contacts
 */
export type UnreadMessages = Array<{
  contact: string;
  count: number;
  messages: ChatMessage[];
}>;

/**
 * Get paginated messages from a conversation
 */
export type PaginatedMessages = {
  messages: ChatMessage[];
  hasMore: boolean;
  total: number;
};

/**
 * Contact status summary
 */
export type ContactStatus = {
  email: string;
  isOnline: boolean;
  isTyping: boolean;
  unreadCount: number;
  lastMessage?: ChatMessage;
  lastMessageTime?: number;
};

/**
 * Chat statistics for debugging/analytics
 */
export interface ChatStatistics {
  totalContacts: number;
  totalMessages: number;
  totalUnread: number;
  onlineContacts: number;
  typingContacts: number;
  averageMessagesPerContact: number;
}

/**
 * Configuration for ChatService
 */
export interface ChatServiceConfig {
  serverUrl: string;
  socketPath?: string;
  transports?: ('websocket' | 'polling')[];
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
  heartbeatInterval?: number;
  typingExpiryTime?: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CHAT_CONFIG: Partial<ChatServiceConfig> = {
  socketPath: '/socket/io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  heartbeatInterval: 20000,
  typingExpiryTime: 3000,
};

/**
 * Helper function to determine if message is sent by current user
 */
export const isSentMessage = (message: ChatMessage): boolean => {
  return message.from === '';
};

/**
 * Helper function to get message status
 */
export const getMessageStatus = (message: ChatMessage): MessageStatusState => {
  if (message.status.read) return 'read';
  if (message.status.delivered) return 'delivered';
  if (message.status.sent) return 'sent';
  return 'pending';
};

/**
 * Helper function to check if message is unread
 */
export const isUnreadMessage = (message: ChatMessage): boolean => {
  return !isSentMessage(message) && !message.status.read;
};
