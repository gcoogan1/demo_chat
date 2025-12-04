import { useEffect } from "react";
import { useChatStore } from "./chat.store";
import { useChatQuery } from "./chat.queries";
import { supabase } from "../../supbaseClient";

// Chat hook using Zustand and React Query
// This hook manages chat state, messages, online users, and sending messages
export const useChatRoom = (leagueId, session) => {
  const userId = session?.user?.id;
  const { data, isLoading } = useChatQuery(leagueId);

  const {
    setChatId,
    setInitialMessages,
    subscribeToRoom,
    unsubscribe,
    messages,
    usersOnline,
  } = useChatStore();

  // Once React Query loads data → hydrate Zustand
  useEffect(() => {
    if (!data || !userId) return;

    setChatId(data.chatId);
    setInitialMessages(data.messages);

    subscribeToRoom(data.chatId, userId);

    return () => unsubscribe();
  }, [data, userId]);

  // Message send function (very small now!)
  const sendMessage = async (text) => {
    if (!userId || !data?.chatId) return;

    const payload = {
      chat_id: data.chatId,
      author_id: userId,
      user_name: session.user.user_metadata.email,
      avatar: session.user.user_metadata.avatar_url,
      message: text,
    };

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("message send error:", error);
      return;
    }

    // Broadcast
    useChatStore.getState().room?.send({
      type: "broadcast",
      event: "message",
      payload: inserted,
    });

    // Add locally (fast UI)
    useChatStore.getState().addMessage(inserted);
  };

  return {
    isLoading,
    messages,
    usersOnline,
    sendMessage,
  };
}
