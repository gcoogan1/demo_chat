import { useEffect, useState, useRef } from "react";
import { useAuth } from "./auth/useAuthHook";
import { useChatRoom } from "./chats/useChatHook";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { ChatWrapper, ChatContainer, Header, HeaderInfo, MessagesContainer, MessageRow, MessageContent, Timestamp, Avatar, TextInput, EmojiButton, EmojiPickerWrapper, SendButton, HeaderText, SignOutButton, ReactionButton, EmojiPickerButton, InputForm } from "./styles";

function App() {
  const [newMessage, setNewMessage] = useState("");

  const chatContainerRef = useRef(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const scroll = useRef();

  // AUTH HANDLERS
  const { session, signIn, signOut } = useAuth();

  // 👉 All chat logic now here
  const { messages, usersOnline, sendMessage } = useChatRoom(1, session);

  const handleSend = async (e) => {
    e.preventDefault();
    console.log("Sending message:", newMessage);
    if (newMessage.trim().length === 0) return;
    await sendMessage(newMessage);
    setNewMessage("");
  };

  const handleOnChange = (e) => {
    if (e.target.value.length > 500) return;
    if (e.target.value.length < 1) return;
    setNewMessage(e.target.value);
  }

  // Format timestamp
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString("en-us", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  console.log("Messages:", messages);

  // Auto scroll to bottom on new message
  useEffect(() => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, [100]);
  }, [messages]);

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
          {/* Header */}
          <Header>
            <HeaderInfo>
              <HeaderText>
                Signed in as {session?.user?.user_metadata?.email}
              </HeaderText>
              <HeaderText>
                {usersOnline.length} users online
              </HeaderText>
            </HeaderInfo>
            <SignOutButton onClick={signOut}>
              Sign out
            </SignOutButton>
          </Header>
          {/* main chat */}
          <MessagesContainer ref={chatContainerRef} >
            {messages.length > 0 &&
              messages.map((msg, idx) => (
                <MessageRow
                  key={idx}
                  isOwn={msg?.user_name === session?.user?.email}
                >
                  {/* received message - avatar on left */}

                  <div className="flex flex-col w-full">
                    <MessageContent isOwn={msg?.user_name === session?.user?.email} >
                      <p>{msg.message}</p>
                    </MessageContent>
                    {/* timestamp */}
                    <Timestamp isOwn={msg?.user_name === session?.user?.email}>
                      {formatTime(msg?.created_at)}
                    </Timestamp>
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


          <InputForm
            onSubmit={handleSend}
          >
            {/* Text input */}
            <TextInput
              value={newMessage}
              onChange={handleOnChange}
              type="text"
              placeholder="Type a message..."
              className="p-2 w-full bg-[#00000040] rounded-lg"
            />

            {/* Emoji button + picker */}
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

            {/* Send button */}
            <SendButton type="submit">Send</SendButton>
            <span ref={scroll}></span>
          </InputForm>
        </ChatContainer>
      </ChatWrapper>

    );
  }
}

export default App;
