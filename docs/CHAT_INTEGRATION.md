# Foodopia Chat Integration Guide

## Overview

This document describes the enhanced chat integration in the Foodopia app. The chat system now includes real-time messaging, message status tracking, typing indicators, and user presence tracking.

## Architecture

### Key Components

1. **ChatService** (`services/ChatService.ts`)
   - Encapsulates all socket.io communication
   - Handles connection, reconnection, and heartbeat
   - Manages typing timeouts and cleanup
   - Provides callbacks for all events

2. **ChatContext** (`Contexts/ChatContext.tsx`)
   - Stores chat state: messages, unread counts, typing status, online status
   - Provides type-safe access to chat data

3. **ChatNavigator** (`navigations/ChatNavigator.tsx`)
   - Initializes ChatService on app startup
   - Manages chat state with useReducer
   - Implements comprehensive socket event handlers
   - Provides chat state and dispatch to child screens

4. **Chat Screen** (`screens/Chat.tsx`)
   - Displays messages with read receipts
   - Shows online/offline and typing status in header
   - Sends messages with unique message IDs
   - Implements debounced typing indicators

5. **ContactsList Screen** (`screens/ContactsList.tsx`)
   - Shows contacts with online status indicator
   - Displays unread message badges
   - Clears unread count when opening a conversation

## Features Implemented

### Message Status Tracking
- Messages are assigned unique IDs (UUID)
- Three-stage delivery: sent → delivered → read
- Visual indicators in message bubbles:
  - Single checkmark (✓) = sent
  - Double checkmark (✓✓) = delivered
  - Blue double checkmark = read

```typescript
message.status = {
  sent?: timestamp,      // Message sent to server
  delivered?: timestamp, // Message reached recipient
  read?: timestamp       // Message opened by recipient
}
```

### Unread Message Counts
- Tracks per-contact unread count
- Displays badge in ContactsList
- Auto-clears when opening conversation
- Updates in real-time as messages arrive

### Typing Indicators
- Debounced typing event (auto-stops after 3 seconds)
- "typing..." text visible to recipient
- Prevents rapid event emission
- Automatic cleanup on message send

### Online Status
- Green indicator on contact avatar (online)
- Gray indicator (offline)
- Heartbeat sent every 20 seconds to maintain online status
- Server considers offline after 30 seconds without heartbeat

### Conversation History
- Loads messages with pagination
- Supports limit and offset parameters
- Automatically loads on demand
- Persisted in local state

## Usage Examples

### Sending a Message
```typescript
// In Chat screen
const submitMessage = useCallback(() => {
    if (!messageToSend.trim()) return;
    
    const messageId = uuidv4();
    chatDispatch({
        type: "ADD_MESSAGE_TO_CHAT",
        message: messageToSend,
        contact: recipientEmail,
        isSent: true,
        timestamp: Date.now(),
        messageId: messageId
    });
    setMessageToSend("");
}, [messageToSend, chatDispatch]);
```

### Receiving a Message
Automatically handled by ChatService callbacks:
```typescript
onMessageReceived: (data) => {
    dispatch({
        type: 'ADD_MESSAGE_TO_CHAT',
        message: data.message,
        contact: data.from,
        isSent: false,
        timestamp: data.timestamp,
        messageId: data.messageId
    });
    // Auto-acknowledge delivery
    service.markMessageDelivered(data.messageId);
}
```

### Typing Status
```typescript
// Automatically managed by Chat screen
handleTyping: (text) => {
    setMessageToSend(text);
    // Typing event sent via ChatService with debounce
    // Auto-stops after 3 seconds of inactivity
}
```

## Data Flow

### Message Lifecycle
1. User types and sends message
2. Message added to local state with `isSent: true`
3. ChatService emits `private-message` event
4. Server acknowledges with `message-sent-ack`
5. Status updated to "sent" ✓
6. Recipient receives `private-message-from-server`
7. Recipient auto-sends delivery acknowledgment
8. Sender receives `message-delivered-receipt`
9. Status updated to "delivered" ✓✓
10. Recipient reads message (opens conversation)
11. Recipient auto-sends read receipt
12. Sender receives `message-read-receipt`
13. Status updated to "read" ✓✓ (blue)

### State Management
```typescript
ChatState {
  chat: ChatEntry[],        // Array of conversations
  totalUnread: number       // Total unread count
}

ChatEntry {
  contact: string,          // Recipient email
  messages: ChatMessage[],  // All messages
  unreadCount: number,      // Unread count
  isTyping: boolean,        // Currently typing
  isOnline: boolean         // Online status
}

ChatMessage {
  messageId: string,
  from: string,
  to: string,
  message: string,
  timestamp: number,
  status: {
    sent?: number,
    delivered?: number,
    read?: number
  }
}
```

## Socket Events Reference

### Events Emitted by Client

| Event | Payload | Purpose |
|-------|---------|---------|
| `register-client` | `{ token }` | Register user session |
| `private-message` | `{ token, to, message, messageId }` | Send message |
| `message-delivered` | `{ messageId }` | Mark message delivered |
| `message-read` | `{ messageId }` | Mark message read |
| `mark-messages-read` | `{ messageIds: [] }` | Bulk mark as read |
| `get-conversation-history` | `{ token, with, limit?, offset? }` | Load messages |
| `get-unread-counts` | `{ token }` | Get unread counts |
| `typing` | `{ token, to }` | Send typing indicator |
| `stop-typing` | `{ token, to }` | Stop typing indicator |
| `heartbeat` | `{ token }` | Keep user online |
| `check-online-status` | `{ userIds: [] }` | Check online status |

### Events Received by Client

| Event | Payload | Purpose |
|-------|---------|---------|
| `register-server` | `string` | Registration confirmation |
| `message-sent-ack` | `{ messageId, to, timestamp }` | Message sent |
| `private-message-from-server` | `{ messageId, from, message, timestamp }` | New message |
| `message-delivered-receipt` | `{ messageId, deliveredAt }` | Message delivered |
| `message-read-receipt` | `{ messageId, readAt }` | Message read |
| `conversation-history` | See guide | Conversation data |
| `unread-counts` | `{ counts: {}, total }` | Unread counts |
| `user-typing` | `{ from, isTyping }` | Typing status |
| `online-status` | `{ status: {} }` | Online/offline status |

## Best Practices

### 1. Message Delivery Flow
Follow this sequence for reliable delivery:
```
Send → ACK → Display "Sent" ✓
     → Deliver → Display "Delivered" ✓✓
     → Read → Display "Read" ✓✓ (blue)
```

### 2. Typing Indicator Strategy
- Debounce to prevent excessive events
- Auto-expire after 3 seconds
- Explicitly send stop-typing when needed
- Max 1 typing event per second

### 3. Unread Count Management
- Fetch counts on app startup
- Auto-clear when opening conversation
- Update in real-time on new messages
- Show badge with "99+" for large counts

### 4. Connection Reliability
- Socket auto-reconnects with exponential backoff
- Heartbeat keeps connection alive
- Max 5 reconnection attempts
- Handles connection errors gracefully

### 5. Performance Optimization
- Use pagination for long conversations
- Virtual scrolling in message lists
- Cache conversation history locally
- Debounce typing indicators
- Clean up timeouts on unmount

## Troubleshooting

### Messages not sending
1. Check if ChatService is initialized
2. Verify JWT token is valid
3. Check socket connection status in logs
4. Verify server is reachable

### Typing indicators not working
1. Ensure typing timeout is being cleared
2. Check if `handleTyping` is properly debounced
3. Verify contact email is correct
4. Check server logs for typing events

### Online status not updating
1. Verify heartbeat is running every 20 seconds
2. Check if user is online according to server
3. Ensure `check-online-status` is called
4. Server may consider user offline after 30 seconds without heartbeat

### Unread count not clearing
1. Verify `CLEAR_UNREAD_COUNT` dispatch is called
2. Check if conversation history is loaded
3. Ensure messages are marked as read
4. Check reducer logic for unread count management

## Dependencies

- `socket.io-client: ^4.7.4` - WebSocket client
- `uuid: ^9.0.0` - Generate unique message IDs
- `react-native` - UI framework
- `react-native-safe-area-context` - Safe area handling

## Installation

To use the enhanced chat system, ensure all dependencies are installed:

```bash
npm install socket.io-client uuid
```

Then, the ChatNavigator will automatically initialize ChatService when the app loads.

## Notes

- All timestamps are in milliseconds since epoch
- Message IDs are UUID v4 format
- Typing indicators auto-expire, no need to explicitly stop
- Unread counts are automatically managed
- Online status is determined by heartbeat presence
- All events include proper error handling and logging
