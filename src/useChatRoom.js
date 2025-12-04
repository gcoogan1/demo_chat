import { useEffect, useState, useRef } from "react";
import { supabase } from "../supbaseClient"

export function useChatRoom(leagueId, session) {
  const [messages, setMessages] = useState([]);
  const [usersOnline, setUsersOnline] = useState([]);
  const roomRef = useRef(null);
  const chatIdRef = useRef(null);

  // --------------------------------------------------------
  // SETUP CHAT, USERS, MESSAGES, REALTIME
  // --------------------------------------------------------
  useEffect(() => {
    if (!session?.user) {
      setUsersOnline([]);
      return;
    }

    let activeRoom = null;

    const setupChatRoom = async () => {
      console.log("🔥 Initializing chat room…");

      // --------------------------------------------------------
      // 1. FETCH OR CREATE CHAT
      // --------------------------------------------------------
      let { data: existingChat, error: chatErr } = await supabase
        .from("chats")
        .select("*")
        .eq("league_id", leagueId)
        .single();

      if (chatErr && chatErr.code !== "PGRST116") {
        console.error("❌ Chat fetch error:", chatErr);
      }

      if (!existingChat) {
        console.log("🆕 Creating chat...");
        const { data: newChat, error: insertErr } = await supabase
          .from("chats")
          .insert({ league_id: leagueId })
          .select()
          .single();

        if (insertErr) {
          console.error("❌ Chat creation error:", insertErr);
          return;
        }

        existingChat = newChat;
      }

      console.log("✅ Chat ID:", existingChat.id);
      chatIdRef.current = existingChat.id;

      // --------------------------------------------------------
      // 2. ENSURE USER IS IN chat_users
      // --------------------------------------------------------
      const { data: userInChat } = await supabase
        .from("chat_users")
        .select("*")
        .eq("chat_id", existingChat.id)
        .eq("chat_user", session.user.id)
        .single();

      if (!userInChat) {
        console.log("➕ Adding user to chat_users…");

        const { error: addErr } = await supabase.from("chat_users").insert({
          chat_id: existingChat.id,
          chat_user: session.user.id,
        });

        if (addErr) console.error("❌ chat_users insert error:", addErr);
      }

      // --------------------------------------------------------
      // 3. LOAD MESSAGES
      // --------------------------------------------------------
      const { data: olderMessages, error: historyErr } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", existingChat.id)
        .order("created_at", { ascending: true });

      if (historyErr) {
        console.error("❌ Error loading messages:", historyErr);
      } else {
        console.log("📥 Loaded messages:", olderMessages?.length);
        setMessages(olderMessages || []);
      }

      // --------------------------------------------------------
      // 4. SETUP REALTIME CHANNEL
      // --------------------------------------------------------
      console.log("📡 Subscribing to realtime…");

      const room = supabase.channel(`chat:${existingChat.id}`, {
        config: {
          presence: { key: session.user.id },
        },
      });

      // Messages
      room.on("broadcast", { event: "message" }, (payload) => {
        console.log("📩 New message:", payload.payload);
        setMessages((prev) => [...prev, payload.payload]);
      });

      // Presence
      room.on("presence", { event: "sync" }, () => {
        const state = room.presenceState();
        setUsersOnline(Object.keys(state));
      });

      // Subscribe
      room.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log("📡 Presence tracking started.");
          await room.track({ id: session.user.id });
        }
      });

      activeRoom = room;
      roomRef.current = room;

      return room;
    };

    setupChatRoom();

    // cleanup
    return () => {
      if (roomRef.current) {
        console.log("🔌 Unsubscribing from chat channel");
        roomRef.current.unsubscribe();
      }
    };
  }, [session, leagueId]);

  // --------------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------------
  const sendMessage = async (messageText) => {
    console.log("🚀 sendMessage called")  ;
    if (!chatIdRef.current || !session?.user) return;

    console.log("✉️ Sending message:", messageText);

    // 1. Save to DB
    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatIdRef.current,
        author_id: session.user.id,
        user_name: session.user.user_metadata.email,
        avatar: session.user.user_metadata.avatar_url,
        message: messageText,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ DB message insert error:", error);
      return;
    }

    console.log("📤 Broadcasting message…");

    // 2. Broadcast to realtime
    if (roomRef.current) {
      roomRef.current.send({
        type: "broadcast",
        event: "message",
        payload: data,
      });
      setMessages((prev) => [...prev, data]);
    }
  };

  return {
    messages,
    usersOnline,
    sendMessage,
  };
}
