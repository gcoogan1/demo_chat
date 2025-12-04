import { create } from "zustand";
import { supabase } from "../../supbaseClient";

// Chat Zustand Store
// This store manages chat messages, online users, and the realtime subscription
export const useChatStore = create((set, get) => ({
  messages: [],
  usersOnline: [],
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
