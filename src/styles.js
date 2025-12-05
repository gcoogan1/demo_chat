import styled from "styled-components";

export const ChatWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
`;

export const ChatContainer = styled.div`
  border: 1px solid #374151;
  max-width: 72rem;
  width: 100%;
  min-height: 600px;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 5rem;
  border-bottom: 1px solid #374151;
  padding: 1rem;
`;

export const HeaderInfo = styled.div`
  p {
    color: #d1d5db;
    &:nth-child(2) {
      font-style: italic;
      font-size: 0.875rem;
    }
  }
`;

export const MessagesContainer = styled.div`
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 500px;
`;

export const MessageRow = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: ${({ isOwn }) => (isOwn ? "flex-end" : "flex-start")};
  margin: 0.5rem 0;
`;

export const MessageContent = styled.div`
  padding: 0.25rem;
  max-width: 70%;
  border-radius: 0.5rem;
  position: relative;
  color: white;
  background-color: ${(props) => (props.isOwn ? "#4b5563" : "#6b7280")};
  margin-left: ${(props) => (props.isOwn ? "auto" : "0")};
  margin-right: ${(props) => (props.isOwn ? "0" : "auto")};
`;

export const MessageText = styled.p`
  margin: 0;
  color: white;
`;

export const LowerMessageContent = styled.div`
  display: flex;
  margin-left: ${(props) => (props.isOwn ? "auto" : "0")};
  margin-right: ${(props) => (props.isOwn ? "0" : "auto")};
  align-items: center;
  position: relative;
  margin-top: 0.25rem;
`;

export const ReactionButton = styled.button`
  padding: 0.25rem 0.5rem;
  background-color: #1f2937;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: white;
  cursor: pointer;
`;

export const ReactionBar = styled.div`
  display: flex;
  gap: 4px;
  position: absolute;
  ${({ isOwn }) => (!isOwn ? "right: 0;" : "left: 0;")}

  background: transparent;
`;

export const ReactionBubble = styled.div`
  padding: 2px 6px;
  font-size: 0.8rem;
  border-radius: 9999px;
  background: #1f2937;
  border: 1px solid #374151;
  display: flex;
  align-items: center;
`;

export const Timestamp = styled.div`
  font-size: 0.75rem;
  opacity: 0.75;
  padding-top: 0.25rem;
  text-align: ${({ isOwn }) => (isOwn ? "right" : "left")};
  margin-right: ${({ isOwn }) => (isOwn ? "0.5rem" : "0")};
  margin-left: ${({ isOwn }) => (!isOwn ? "0.5rem" : "0")};
`;

export const Avatar = styled.img`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  margin-left: 0.5rem;
`;

export const InputForm = styled.form`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid #374151;
  position: relative;
`;

export const TextInput = styled.input`
  padding: 0.5rem;
  width: 100%;
  border-radius: 0.5rem;
  background-color: rgba(0, 0, 0, 0.25);
`;

export const EmojiButton = styled.button`
  font-size: 1.5rem;
`;

export const EmojiPickerWrapper = styled.div`
  position: relative;
`;

export const HeaderText = styled.p`
  color: #d1d5db;
  margin: 0;
  &:nth-child(2) {
    font-style: italic;
    font-size: 0.875rem; 
`;

export const SignOutButton = styled.button`
  margin: 0.5rem;
  font-size: 1rem;
  background: none;
  border: none;
  color: #d1d5db;
  cursor: pointer;
`;

export const EmojiPickerButton = styled.button`
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
`;

export const SendButton = styled.button`
  color: white;
  max-height: 3rem;
  margin-left: 0.5rem;

  border: none;
  cursor: pointer;
`;
