import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supbaseClient";

// Chat data fetching and caching with React Query
// This query fetches or creates the chat for a league and loads its messages
export const useChatQuery = (leagueId) => {

  return useQuery({
    // Unique query key
    queryKey: ["chat", leagueId],
    // Fetch function
    queryFn: async () => {
      // 1. Fetch or create chat
      let { data: chat, error } = await supabase
        .from("chats")
        .select("*")
        .eq("league_id", leagueId)
        .maybeSingle();

      // 1.1 If error other than no rows, throw
      if (error && error.code !== "PGRST116") throw error;

      // 1.2 If no chat, create one
      if (!chat) {
        const { data: newChat, error: createErr } = await supabase
          .from("chats")
          .insert({ league_id: leagueId })
          .select()
          .single();
        if (createErr) throw createErr;
        chat = newChat;
      }

      // 2. Load messages for this chat using chat.id
      const { data: messages, error: msgErr } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });

      // 2.1 If error, throw
      if (msgErr) throw msgErr;

      // 3. Return chat ID and messages
      return { chatId: chat.id, messages };
    },

    // Cache data for 5 minutes
    staleTime: 1000 * 60 * 5,
  });
}
