import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supbaseClient";

// Fetch chat, ensure membership, load messages + reactions + users
export const useChatQuery = (leagueId, userId, email) => {
  return useQuery({
    queryKey: ["chat", leagueId, userId],

    queryFn: async () => {
      if (!userId) return null;

      //
      // 1. Fetch or create chat
      //
      let { data: chat, error } = await supabase
        .from("chats")
        .select("*")
        .eq("league_id", leagueId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (!chat) {
        const { data: newChat, error: createErr } = await supabase
          .from("chats")
          .insert({ league_id: leagueId })
          .select()
          .single();

        if (createErr) throw createErr;
        chat = newChat;
      }

      //
      // 2. Ensure user is a member of this chat
      //
      const { data: membership } = await supabase
        .from("chat_users")
        .select("*")
        .eq("chat_id", chat.id)
        .eq("chat_user", userId)
        .maybeSingle();

      if (!membership) {
        const { error: addErr } = await supabase
          .from("chat_users")
          .insert({
            chat_id: chat.id,
            chat_user: userId,
            email: email ?? "Anonymous",
          });

        if (addErr) throw addErr;
      }

      //
      // 3. Fetch messages WITH reactions JOINED
      //
      const { data: messages, error: msgErr } = await supabase
        .from("messages")
        .select(`
          *,
          reactions:reactions (
            emoji,
            user_id,
            message_id,
            id
          )
        `)
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });

      if (msgErr) throw msgErr;

      //
      // 4. Load chat users (for @mentions autocomplete)
      //
      const { data: chatUserList } = await supabase
        .from("chat_users")
        .select("email, chat_user")
        .eq("chat_id", chat.id);

      return {
        chatId: chat.id,
        messages,       // already contains reactions[]
        chatUsers: chatUserList,
      };
    },

    staleTime: 1000 * 60 * 5,
  });
};
