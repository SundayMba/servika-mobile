import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { tokenStorage } from '@/lib/auth/tokenStorage';
import {
  getChatUnreadCount,
  getConversations,
  getMessages,
  sendMessage,
} from '@/lib/api/chat';
import type { ChatMessage } from '@/lib/chat/types';
import { config } from '@/lib/config';

const HUB_URL = `${config.apiBaseUrl}/hubs/chat`;
const messagesKey = (bookingId: string) => ['chat', bookingId] as const;

/** Append a message to a thread's cache, de-duplicating by id (the sender gets it
 *  from both the POST response and the hub broadcast). */
function appendMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  bookingId: string,
  message: ChatMessage,
) {
  queryClient.setQueryData<ChatMessage[]>(messagesKey(bookingId), (old) => {
    if (!old) return [message];
    if (old.some((m) => m.id === message.id)) return old;
    return [...old, message];
  });
}

/** A booking's conversation thread (oldest first). */
export function useChatMessages(bookingId: string | undefined) {
  return useQuery({
    queryKey: messagesKey(bookingId ?? ''),
    queryFn: () => getMessages(bookingId as string),
    enabled: !!bookingId,
  });
}

/** Send a message; the persisted result is appended to the thread cache. */
export function useSendMessage(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(bookingId, body),
    onSuccess: (message) => {
      appendMessage(queryClient, bookingId, message);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** The messages-tab conversation list. */
export function useConversations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

/** Total unread messages (tab badge); polls while signed in. */
export function useChatUnreadCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['chat-unread'],
    queryFn: getChatUnreadCount,
    enabled: options?.enabled ?? true,
    refetchInterval: 60_000,
  });
}

/**
 * Live delivery for an open thread. Connects to the chat hub, joins the booking's
 * group, and folds incoming `MessageReceived` events into the thread cache (deduped)
 * so new messages appear without a refetch. Torn down on unmount / id change.
 */
export function useChatRealtime(bookingId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;
    const conn: HubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: async () => (await tokenStorage.getAccessToken()) ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on('MessageReceived', (message: ChatMessage) => {
      if (cancelled) return;
      appendMessage(queryClient, bookingId, message);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    });

    const join = async () => {
      try {
        await conn.start();
        if (!cancelled) await conn.invoke('JoinConversation', bookingId);
      } catch {
        // best-effort — history + send still work over REST
      }
    };
    join();
    conn.onreconnected(() => {
      conn.invoke('JoinConversation', bookingId).catch(() => {});
    });

    return () => {
      cancelled = true;
      conn.stop().catch(() => {});
    };
  }, [bookingId, queryClient]);
}
