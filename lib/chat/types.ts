/** Mirrors the backend Chat DTOs (Servika.Contracts.Chat). */

export type ChatSenderRole = 'Customer' | 'Artisan';

export type ChatMessage = {
  id: string;
  bookingId: string;
  senderUserId: string;
  senderRole: ChatSenderRole;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type SendMessageRequest = { body: string };

export type Conversation = {
  bookingId: string;
  artisanId: string | null;
  counterpartyName: string;
  serviceName: string;
  bookingStatus: string;
  lastMessage: string;
  lastMessageAtUtc: string;
  unreadCount: number;
};
