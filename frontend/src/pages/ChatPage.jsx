import { useWallpaper } from "../context/wallpaper";
import { useChatStore } from "../store/useChatStore";
import { useSelectedConversation } from "../hooks/useSelectedConversation";
import { useEffect } from "react";
import ChatSidebar from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { ChatComposer } from "../components/chat/ChatComposer";
import { useAuthStore } from "../store/useAuthStore";

function ChatPage() {
  const { frameStyle } = useWallpaper();

  const getConversations = useChatStore((state) => state.getConversations);
  const getMessages = useChatStore((state) => state.getMessages);
  const getRelationships = useChatStore((state) => state.getRelationships);
  const getStatuses = useChatStore((state) => state.getStatuses);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);
  const socket = useAuthStore((state) => state.socket);

  const { activeConversation, activeConversationId, isLargeScreen } = useSelectedConversation();

  useEffect(() => {
    getConversations();
    getRelationships();
    getStatuses();
  }, [getConversations, getRelationships, getStatuses]);

  useEffect(() => {
    if (!socket) return;

    const handleRelationshipsUpdated = () => {
      getRelationships();
      getStatuses();
    };

    socket.on("relationshipsUpdated", handleRelationshipsUpdated);
    return () => socket.off("relationshipsUpdated", handleRelationshipsUpdated);
  }, [socket, getRelationships, getStatuses]);

  useEffect(() => {
    if (!activeConversationId) return;

    getMessages(activeConversationId);
    subscribeToMessages(activeConversationId);

    // cleanup
    return () => unsubscribeFromMessages();
  }, [getMessages, activeConversationId, subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden p-2 sm:p-3 md:p-6" style={frameStyle}>
      <div className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden rounded-2xl border border-white/70 bg-white/85 text-foreground shadow-[0_30px_90px_-40px_rgba(47,32,115,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#151521]/90 sm:rounded-3xl">
        <ChatSidebar />

        <div
          className={`flex-1 flex-col overflow-hidden ${
            !isLargeScreen && !activeConversationId ? "hidden lg:flex" : "flex"
          }`}
        >
          <ChatHeader />
          <MessageList />

          {activeConversation ? <ChatComposer /> : null}
        </div>
      </div>
    </div>
  );
}
export default ChatPage;