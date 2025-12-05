import { useEffect } from "react";
import { useChatStore } from "./chat.store";
import { useChatQuery } from "./chat.queries";
import { supabase } from "../../supbaseClient";

// Chat hook using Zustand and React Query
// This hook manages chat state, messages, online users, and sending messages
export const useChatRoom = (leagueId, session) => {
  const userId = session?.user?.id;
  const email = session?.user?.user_metadata?.email;
  const { data, isLoading } = useChatQuery(leagueId, userId, email);

  const {
    setChatId,
    setInitialMessages,
    subscribeToRoom,
    unsubscribe,
    addReaction,
    removeReaction,
    messages,
    usersOnline,
    userList,
  } = useChatStore();

  // Once React Query loads data → hydrate Zustand
  useEffect(() => {
    if (!data || !userId) return;

    setChatId(data.chatId);
    setInitialMessages(data.messages);

    subscribeToRoom(data.chatId, userId);
    loadUsers();

    return () => unsubscribe();
  }, [data, userId]);

  // Load all users for @mentions
  const loadUsers = async () => {
    const { data: users } = await supabase.from("chat_users").select("*");

    useChatStore.getState().setUserList(users || []);
  };

  // Message send function
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

    // Add locally
    useChatStore.getState().addMessage(inserted);
  };

  const handleReaction = async (messageId, emoji) => {
    if (!userId) return;

    const message = messages.find((m) => m.id === messageId);
    const existing = message.reactions?.find(
      (r) => r.user_id === userId && r.emoji === emoji
    );

    if (existing) {
      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", userId)
        .eq("emoji", emoji);

      if (!error) {
        removeReaction(messageId, userId, emoji);
        useChatStore.getState().room?.send({
          type: "broadcast",
          event: "reaction.remove",
          payload: {
            message_id: messageId,
            user_id: userId,
            emoji,
          },
        });
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("reactions")
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji,
        })
        .select()
        .single();

      if (!error) {
        addReaction(messageId, inserted);
        useChatStore.getState().room?.send({
          type: "broadcast",
          event: "reaction.add",
          payload: inserted,
        });
      }
    }
  };

  return {
    isLoading,
    messages,
    usersOnline,
    sendMessage,
    userList,
    handleReaction,
  };
};
