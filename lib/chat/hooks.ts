import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';

import { tokenStorage } from '@/lib/auth/tokenStorage';
import {
  getChatUnreadCount,
  getConversations,
  getMessages,
  sendMessage,
  startConversationForBooking,
  startConversationWithArtisan,
} from '@/lib/api/chat';
import type { ChatMessage } from '@/lib/chat/types';
import { config } from '@/lib/config';
import { usePhoneGate } from '@/lib/phone/PhoneGate';

const HUB_URL = `${config.apiBaseUrl}/hubs/chat`;
const messagesKey = (conversationId: string) => ['chat', conversationId] as const;

/** Append a message to a thread's cache, de-duplicating by id (the sender gets it
 *  from both the POST response and the hub broadcast). */
function appendMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: ChatMessage,
) {
  queryClient.setQueryData<ChatMessage[]>(messagesKey(conversationId), (old) => {
    if (!old) return [message];
    if (old.some((m) => m.id === message.id)) return old;
    return [...old, message];
  });
}

/** A conversation's thread (oldest first). */
export function useChatMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: messagesKey(conversationId ?? ''),
    queryFn: () => getMessages(conversationId as string),
    enabled: !!conversationId,
  });
}

/** Send a message; the persisted result is appended to the thread cache. */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),
    onSuccess: (message) => {
      appendMessage(queryClient, conversationId, message);
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
 * Imperative openers for the chat screen. Callers rarely hold a conversation id —
 * they have an artisan (from browse) or a booking (from an active job). These resolve
 * the pair's conversation (creating it if needed) and then navigate to the thread.
 * Best-effort: a resolve failure is swallowed rather than throwing into a tap handler.
 */
export function useOpenChat() {
  const router = useRouter();
  const phoneGate = usePhoneGate();

  const openConversation = useCallback(
    (conversationId: string, name?: string) => {
      router.push({
        pathname: '/chat/[id]',
        params: { id: conversationId, ...(name ? { name } : {}) },
      });
    },
    [router],
  );

  const openWithArtisan = useCallback(
    async (artisanId: string, name?: string) => {
      try {
        const ref = await startConversationWithArtisan(artisanId);
        // Pass artisanId so the thread shows a "Book" CTA — this is a customer-side,
        // pre-booking conversation where nudging toward a real booking matters most.
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: ref.id,
            name: name ?? ref.counterpartyName,
            artisanId: ref.artisanId,
          },
        });
      } catch (e) {
        // If the server requires a verified phone, prompt for it, then re-open.
        if (phoneGate.handle(e, () => openWithArtisan(artisanId, name))) return;
        // best-effort — the artisan profile / card action just no-ops on failure
      }
    },
    [router, phoneGate],
  );

  const openForBooking = useCallback(
    async (bookingId: string, name?: string) => {
      try {
        const ref = await startConversationForBooking(bookingId);
        openConversation(ref.id, name ?? ref.counterpartyName);
      } catch {
        // best-effort
      }
    },
    [openConversation],
  );

  return { openConversation, openWithArtisan, openForBooking };
}

/**
 * Live delivery for an open thread. Connects to the chat hub, joins the
 * conversation's group, and folds incoming `MessageReceived` events into the thread
 * cache (deduped) so new messages appear without a refetch. Torn down on unmount /
 * id change.
 */
export function useChatRealtime(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;
    const conn: HubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: async () => (await tokenStorage.getAccessToken()) ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Critical) // transient WS drops auto-reconnect; don't spam console.error / dev LogBox
      .build();

    conn.on('MessageReceived', (message: ChatMessage) => {
      if (cancelled) return;
      appendMessage(queryClient, conversationId, message);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    });

    const join = async () => {
      try {
        await conn.start();
        if (!cancelled) await conn.invoke('JoinConversation', conversationId);
      } catch {
        // best-effort — history + send still work over REST
      }
    };
    join();
    conn.onreconnected(() => {
      conn.invoke('JoinConversation', conversationId).catch(() => {});
    });

    return () => {
      cancelled = true;
      conn.stop().catch(() => {});
    };
  }, [conversationId, queryClient]);
}
