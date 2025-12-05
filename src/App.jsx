import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./auth/useAuthHook";
import { useChatRoom } from "./chats/useChatHook";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import {
  ChatWrapper,
  ChatContainer,
  Header,
  HeaderInfo,
  MessagesContainer,
  MessageRow,
  MessageContent,
  LowerMessageContent,
  ReactionButton,
  Timestamp,
  Avatar,
  TextInput,
  EmojiPickerWrapper,
  SendButton,
  HeaderText,
  SignOutButton,
  MessageText,
  InputForm,
  ReactionBar,
  ReactionBubble,
} from "./styles";

function App() {
  const [newMessage, setNewMessage] = useState("");

  const chatContainerRef = useRef(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showPickerForMessageId, setShowPickerForMessageId] = useState(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  const openPicker = (event, msgId) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPickerPosition({
      top: rect.bottom + window.scrollY + 5, // 5px below button
      left: rect.left + window.scrollX,
    });
    setShowPickerForMessageId(msgId);
  };

  const closePicker = () => setShowPickerForMessageId(null);

  const scroll = useRef();

  // AUTH HANDLERS
  const { session, signIn, signOut } = useAuth();

  // 👉 All chat logic now here
  const { messages, usersOnline, sendMessage, userList, handleReaction } = useChatRoom(
    1,
    session
  );

  // Auto scroll to bottom on new message
  useEffect(() => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, [100]);
  }, [messages]);

  // Send message handler
  const handleSend = async (e) => {
    e.preventDefault();
    if (newMessage.trim().length === 0) return;
    await sendMessage(newMessage);
    setNewMessage("");
  };

  // Handle input change for mentions
  // checks for "@" and filters user list
  const handleOnChange = (e) => {
    const value = e.target.value;
    if (value.length > 500) return;
    setNewMessage(value);

    const match = value.match(/@([a-zA-Z0-9_]*)$/);

    if (match) {
      const query = match[1].toLowerCase();

      const results = userList.filter((u) =>
        u?.email?.toLowerCase().includes(query)
      );

      setFilteredUsers(results);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Insert mention into message input
  const insertMention = (email) => {
    // replaces the @query part with the full display name mention
    setNewMessage((prev) => prev.replace(/@([a-zA-Z0-9_]*)$/, `@${email} `));
    setShowMentions(false);
  };

  // Highlight mention in message text
  const hightlightMention = (msg) => {
    const me = session?.user?.user_metadata?.email;
    if (!me) return msg;
    const regex = new RegExp(`@${me}`, "gi");
    return msg.message.replace(
      regex,
      `<span style="color: blue; font-weight: bold;">@${me}</span>`
    );
  };

  // Format timestamp
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString("en-us", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  

  if (!session) {
    return (
      <ChatWrapper>
        <button onClick={signIn}>Sign in with Google to chat</button>
      </ChatWrapper>
    );
  } else {
    return (
      <ChatWrapper>
        <ChatContainer>
          <Header>
            <HeaderInfo>
              <HeaderText>
                Signed in as {session?.user?.user_metadata?.email}
              </HeaderText>
              <HeaderText>{usersOnline.length} users online</HeaderText>
            </HeaderInfo>
            <SignOutButton onClick={signOut}>Sign out</SignOutButton>
          </Header>

          <MessagesContainer ref={chatContainerRef}>
            {messages.length > 0 &&
              messages.map((msg, idx) => (
                <MessageRow
                  key={idx}
                  isOwn={msg?.user_name === session?.user?.email}
                >
                  <div className="flex flex-col w-full">
                    <MessageContent
                      isOwn={msg?.user_name === session?.user?.email}
                    >
                      <MessageText
                        dangerouslySetInnerHTML={{
                          __html: hightlightMention(msg),
                        }}
                      />
                    {msg.reactions?.length > 0 && (
                      <ReactionBar isOwn={msg?.user_name === session?.user?.email}>
                        {msg.reactions.map((reaction, idx) => (
                          <ReactionBubble key={idx}>
                            {reaction.emoji}
                          </ReactionBubble>
                        ))}
                      </ReactionBar>
                    )}
                    </MessageContent>


                    <LowerMessageContent
                      isOwn={msg?.user_name === session?.user?.email}
                    >
                      <ReactionButton onClick={(e) => openPicker(e, msg.id)}>
                        ❤️
                      </ReactionButton>
                      <Timestamp>{formatTime(msg.created_at)}</Timestamp>

                      {showPickerForMessageId === msg.id &&
                        createPortal(
                          <div
                            style={{
                              position: "absolute",
                              top: pickerPosition.top,
                              left: pickerPosition.left,
                              zIndex: 1000,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                              borderRadius: "8px",
                              background: "#1e1e1e",
                            }}
                          >
                            <Picker
                              data={data}
                              onEmojiSelect={(emoji) => {
                                handleReaction(msg.id, emoji.native);
                                closePicker();
                              }}
                            />
                          </div>,
                          document.body
                        )}
                    </LowerMessageContent>
                  </div>

                  {msg?.user_name === session?.user?.email && (
                    <Avatar
                      src={msg?.avatar}
                      alt="/"
                      className="w-10 h-10 rounded-full ml-2"
                    />
                  )}
                </MessageRow>
              ))}
          </MessagesContainer>

          <InputForm onSubmit={handleSend}>
            <TextInput
              value={newMessage}
              onChange={handleOnChange}
              type="text"
              placeholder="Type a message..."
              className="p-2 w-full bg-[#00000040] rounded-lg"
            />
            {showMentions && filteredUsers.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "55px",
                  left: "10px",
                  background: "#262626",
                  borderRadius: "8px",
                  padding: "8px",
                  zIndex: 100,
                  width: "250px",
                  maxHeight: "150px",
                  overflowY: "auto",
                }}
              >
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => insertMention(u.email)}
                    style={{
                      padding: "6px 8px",
                      cursor: "pointer",
                      borderRadius: "6px",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#333")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    @{u.email}
                  </div>
                ))}
              </div>
            )}

            <EmojiPickerWrapper>
              <button
                type="button"
                onClick={() => setShowEmoji((s) => !s)}
                className="text-2xl"
              >
                😀
              </button>

              {showEmoji && (
                <div className="absolute bottom-12 right-0 z-50">
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji) =>
                      setNewMessage((prev) => prev + emoji.native)
                    }
                  />
                </div>
              )}
            </EmojiPickerWrapper>

            <SendButton type="submit">Send</SendButton>
            <span ref={scroll}></span>
          </InputForm>
        </ChatContainer>
      </ChatWrapper>
    );
  }
}

export default App;
