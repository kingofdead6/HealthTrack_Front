import React from "react";
import { useParams } from "react-router-dom";
import ChatList from "../../components/Chat/ChatList";
import ChatWindow from "../../components/Chat/ChatWindow";
import { SocketProvider } from "../../context/SocketContext";

export default function Chats({ userId }) {
  // Get chatId from URL parameters
  const { chatId } = useParams();

  return (
    // Provide socket context for real-time messaging
    <SocketProvider userId={userId}>
      <div className="flex gap-4 h-[80vh] p-4">
        <div className="w-1/3">
          <ChatList userId={userId} />
        </div>
        <div className="w-2/3">
          {chatId ? (
            <ChatWindow chatId={chatId} userId={userId} />
          ) : (
            <div className="bg-white rounded-lg shadow p-4 h-full flex items-center justify-center">
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </SocketProvider>
  );
}