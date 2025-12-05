import { create } from "zustand";
import { supabase } from "../../supbaseClient";

// Chat Zustand Store
// This store manages chat messages, online users, and the realtime subscription
export const useChatStore = create((set, get) => ({
  messages: [],
  usersOnline: [],
  userList: [],
  chatId: null,
  room: null,

  // Set chat ID
  setChatId: (id) => set({ chatId: id }),
  // Initialize messages
  setInitialMessages: (msgs) => set({ messages: msgs }),

  // Add a new message
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  // Update online users
  setUsersOnline: (users) => set({ usersOnline: users }),
  // Set user list
  setUserList: (users) => set({ userList: users }),

    // --- REACTIONS ---
  setMessageReactions: (messageId, reactions) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, reactions } : m
      ),
    }));
  },

  addReaction: (messageId, reaction) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, reactions: [...(m.reactions || []), reaction] }
          : m
      ),
    }));
  },

  removeReaction: (messageId, userId, emoji) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              reactions: m.reactions.filter(
                (r) => !(r.user_id === userId && r.emoji === emoji)
              ),
            }
          : m
      ),
    }));
  },


  // Setup realtime subscription
  subscribeToRoom: (chatId, userId) => {
    // Create a new channel for the chat room
    const room = supabase.channel(`chat:${chatId}`, {
      config: { presence: { key: userId } },
    });

    // Incoming messages
    room.on("broadcast", { event: "message" }, (e) => {
      get().addMessage(e.payload);
    });

      // --- Reactions: Add ---
    room.on("broadcast", { event: "reaction.add" }, (e) => {
      const reaction = e.payload;
      get().addReaction(reaction.message_id, reaction);
    });

    // --- Reactions: Remove ---
    room.on("broadcast", { event: "reaction.remove" }, (e) => {
      const reaction = e.payload;
      get().removeReaction(
        reaction.message_id,
        reaction.user_id,
        reaction.emoji
      );
    });


    // Presence
    room.on("presence", { event: "sync" }, () => {
      const state = room.presenceState();
      get().setUsersOnline(Object.keys(state));
    });

    // Subscribe to the room and track presence
    room.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await room.track({ id: userId });
      }
    });

    // Set the room in state
    set({ room });
  },

  // Cleanup
  unsubscribe: () => {
    const room = get().room;
    room?.unsubscribe();
    set({ room: null });
  },
}));
