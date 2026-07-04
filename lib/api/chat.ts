import { apiClient } from '@/lib/api/client';
import type { ChatMessage, Conversation } from '@/lib/chat/types';

/**
 * Booking conversation endpoints (PRD §Chat). Auth-gated and scoped server-side to
 * the two participants of the booking (customer-owner + assigned artisan). Sending
 * is over REST (reliable + persisted); real-time delivery arrives via the chat hub.
 */

export async function getMessages(bookingId: string): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ChatMessage[]>(
    `/api/v1/bookings/${bookingId}/messages`,
  );
  return data;
}

export async function sendMessage(
  bookingId: string,
  body: string,
): Promise<ChatMessage> {
  const { data } = await apiClient.post<ChatMessage>(
    `/api/v1/bookings/${bookingId}/messages`,
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
