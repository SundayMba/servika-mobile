/** Mirrors the backend Chat DTOs (Servika.Contracts.Chat). */

export type ChatSenderRole = 'Customer' | 'Artisan';

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderRole: ChatSenderRole;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type SendMessageRequest = { body: string };

export type Conversation = {
  id: string;
  artisanId: string;
  counterpartyName: string;
  lastMessage: string;
  lastMessageAtUtc: string;
  unreadCount: number;
};

/** A pointer to a conversation returned by the resolve endpoints (may have no
 *  messages yet — enough to open the thread). */
export type ConversationRef = {
  id: string;
  artisanId: string;
  counterpartyName: string;
};
