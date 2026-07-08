import { apiClient } from '@/lib/api/client';
import type {
  ChatMessage,
  Conversation,
  ConversationRef,
} from '@/lib/chat/types';

/**
 * Conversation endpoints (PRD §Chat). A conversation is the two-party thread between
 * a customer and an artisan, keyed by that pair — so it can start from an artisan's
 * profile before any booking, and every booking between them resolves to the same
 * thread. Auth-gated and scoped server-side to the two participants. Sending is over
 * REST (reliable + persisted); real-time delivery arrives via the chat hub.
 */

/** Resolve-or-create the caller's conversation with an artisan (browse → "Chat"). */
export async function startConversationWithArtisan(
  artisanId: string,
): Promise<ConversationRef> {
  const { data } = await apiClient.post<ConversationRef>(
    `/api/v1/conversations/with-artisan/${artisanId}`,
  );
  return data;
}

/** Resolve-or-create the conversation attached to a booking's pair (either party). */
export async function startConversationForBooking(
  bookingId: string,
): Promise<ConversationRef> {
  const { data } = await apiClient.post<ConversationRef>(
    `/api/v1/conversations/for-booking/${bookingId}`,
  );
  return data;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ChatMessage[]>(
    `/api/v1/conversations/${conversationId}/messages`,
  );
  return data;
}

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<ChatMessage> {
  const { data } = await apiClient.post<ChatMessage>(
    `/api/v1/conversations/${conversationId}/messages`,
    { body },
  );
  return data;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await apiClient.get<Conversation[]>('/api/v1/conversations');
  return data;
}

export async function getChatUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>(
    '/api/v1/conversations/unread-count',
  );
  return data.count;
}
