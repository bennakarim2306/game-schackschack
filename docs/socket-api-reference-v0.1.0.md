# Socket.IO API Reference

## Socket Listeners (Client → Server)

| Event | Data Type | Description |
|-------|-----------|-------------|
| `message` | `string` | Basic message from client |
| `register-client` | `{ token: string }` | Client registration with JWT token |
| `private-message` | `{ token: string, to: string, message: string }` | Send private message to user |
| `message-delivered` | `{ messageId: string }` | Acknowledge message delivery |
| `message-read` | `{ messageId: string }` | Acknowledge message read |
| `mark-messages-read` | `{ messageIds: string[] }` | Bulk mark multiple messages as read |
| `confirm-contact-request` | `{ to: string, message: string }` | Confirm contact request |
| `get-conversation-history` | `{ token: string, with: string, limit?: number, offset?: number }` | Request conversation history (default limit: 50, offset: 0) |
| `get-unread-counts` | `{ token: string }` | Request unread message counts |
| `typing` | `{ token: string, to: string }` | Indicate user is typing |
| `stop-typing` | `{ token: string, to: string }` | Indicate user stopped typing |
| `heartbeat` | `{ token: string }` | Keep-alive signal to maintain online status |
| `check-online-status` | `{ userIds: string[] }` | Check online status of multiple users |
| `disconnect` | - | User disconnected (no data) |

## Socket Emitters (Server → Client)

| Event | Data Type | Description |
|-------|-----------|-------------|
| `response from server` | `string` | Echo response to message |
| `register-server` | `string` | Confirmation of client registration |
| `private-message-from-server` | `{ messageId: string, from: object, message: string, timestamp: number }` | Incoming private message |
| `message-sent-ack` | `{ messageId: string, to: string, timestamp: number }` | Message sent acknowledgment |
| `message-delivered-receipt` | `{ messageId: string, deliveredAt: number }` | Message delivery receipt |
| `message-read-receipt` | `{ messageId: string, readAt: number }` | Message read receipt |
| `conversation-history` | `{ with: string, messages: object[], hasMore: boolean, offset: number, limit: number }` | Conversation history response |
| `unread-counts` | `{ counts: object, total: number }` | Unread message counts by sender |
| `user-typing` | `{ from: string, isTyping: boolean }` | Typing status indicator |
| `online-status` | `{ status: object }` | Online status of users |

## Connection Flow

```
Client connects → register-client → Server responds with register-server
Client can now send/receive private-message, typing indicators, etc.
Client sends heartbeat to maintain online status
Client disconnects → Server cleans up session
```
