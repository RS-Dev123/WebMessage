import { create } from "zustand";
import { persist } from "zustand/middleware";

import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

function getRelationshipProfile(state, userId) {
  const profile = [
    state.userSearchResult,
    ...state.followers,
    ...state.following,
    ...state.users,
  ].find((user) => String(user?._id ?? user?.id) === String(userId));

  if (!profile) return null;

  return {
    ...profile,
    _id: profile._id ?? profile.id,
    fullName: profile.fullName ?? profile.name,
    profilePic: profile.profilePic ?? profile.avatarUrl ?? "",
  };
}

export const useChatStore = create(
  persist(
    (set, get) => ({
      users: [],
      userSearchResult: null,
      followers: [],
      following: [],
      statuses: [],
      conversations: [],
      messages: [],
      selectedUser: null,
      isConversationsLoading: false,
      isUsersLoading: false,
      isSearchingUsers: false,
      isStatusesLoading: false,
      isPostingStatus: false,
      isMessagesLoading: false,
      isDeletingConversation: false,
      activeConversationId: null,
      searchQuery: "",
      sidebarTab: "chats",
      composerText: "",
      isSoundEnabled: true,
      isSendingMedia: false,

      searchUser: async (publicId) => {
        const normalizedId = publicId.trim().toUpperCase();
        if (!normalizedId) {
          set({ userSearchResult: null });
          return null;
        }

        set({ isSearchingUsers: true, userSearchResult: null });
        try {
          const res = await axiosInstance.get(
            `/messages/users/${encodeURIComponent(normalizedId)}`,
          );
          set((state) => ({
            userSearchResult: res.data,
            users: [res.data, ...state.users.filter((user) => user._id !== res.data._id)],
          }));
          return res.data;
        } catch (error) {
          console.error("Error in searchUser:", error);
          toast.error(error.response?.data?.message || "Failed to find user");
          return null;
        } finally {
          set({ isSearchingUsers: false });
        }
      },

      getRelationships: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/users/relationships");
          const relatedUsers = [...res.data.followers, ...res.data.following];
          set((state) => ({
            followers: res.data.followers,
            following: res.data.following,
            users: [
              ...relatedUsers,
              ...state.users.filter(
                (user) => !relatedUsers.some((relatedUser) => relatedUser._id === user._id),
              ),
            ],
          }));
        } catch (error) {
          console.error("Error in getRelationships:", error);
          toast.error(error.response?.data?.message || "Failed to load followers");
        } finally {
          set({ isUsersLoading: false });
        }
      },

      followUser: async (userId) => {
        const previousState = get();
        const profile = getRelationshipProfile(previousState, userId);
        if (profile) {
          set((state) => ({
            following: [
              { ...profile, followStatus: "following" },
              ...state.following.filter((user) => String(user._id) !== String(userId)),
            ],
            followers: state.followers.map((user) =>
              String(user._id) === String(userId)
                ? { ...user, followStatus: "following" }
                : user,
            ),
            userSearchResult:
              String(state.userSearchResult?._id) === String(userId)
                ? { ...state.userSearchResult, followStatus: "following" }
                : state.userSearchResult,
          }));
        }

        try {
          await axiosInstance.post(`/messages/users/${userId}/follow`);
          toast.success("Following");
          await Promise.all([get().getRelationships(), get().refreshUserSearchResult()]);
          return true;
        } catch (error) {
          console.error("Error in followUser:", error);
          set({
            followers: previousState.followers,
            following: previousState.following,
            userSearchResult: previousState.userSearchResult,
          });
          await get().getRelationships();
          await get().refreshUserSearchResult();
          toast.error(error.response?.data?.message || "Failed to follow user");
          return false;
        }
      },

      getStatuses: async () => {
        set({ isStatusesLoading: true });
        try {
          const response = await axiosInstance.get("/messages/statuses");
          set({ statuses: response.data });
        } catch (error) {
          console.error("Error in getStatuses:", error);
          toast.error(error.response?.data?.message || "Failed to load statuses");
        } finally {
          set({ isStatusesLoading: false });
        }
      },

      createStatus: async ({ text, file }) => {
        const formData = new FormData();
        if (text.trim()) formData.append("text", text.trim());
        if (file) formData.append("media", file);

        set({ isPostingStatus: true });
        try {
          await axiosInstance.post("/messages/statuses", formData);
          toast.success("Status shared for 24 hours");
          await get().getStatuses();
          return true;
        } catch (error) {
          console.error("Error in createStatus:", error);
          toast.error(error.response?.data?.message || "Failed to share status");
          return false;
        } finally {
          set({ isPostingStatus: false });
        }
      },

      unfollowUser: async (userId) => {
        const previousState = get();
        set((state) => ({
          following: state.following.filter((user) => String(user._id) !== String(userId)),
          followers: state.followers.map((user) =>
            String(user._id) === String(userId)
              ? { ...user, followStatus: "followBack" }
              : user,
          ),
          userSearchResult:
            String(state.userSearchResult?._id) === String(userId)
              ? {
                  ...state.userSearchResult,
                  followStatus: state.followers.some(
                    (user) => String(user._id) === String(userId),
                  )
                    ? "followBack"
                    : "follow",
                }
              : state.userSearchResult,
        }));

        try {
          await axiosInstance.delete(`/messages/users/${userId}/follow`);
          toast.success("Unfollowed user");
          await Promise.all([get().getRelationships(), get().refreshUserSearchResult()]);
          return true;
        } catch (error) {
          console.error("Error in unfollowUser:", error);
          set({
            followers: previousState.followers,
            following: previousState.following,
            userSearchResult: previousState.userSearchResult,
          });
          await get().getRelationships();
          await get().refreshUserSearchResult();
          toast.error(error.response?.data?.message || "Failed to unfollow user");
          return false;
        }
      },

      refreshUserSearchResult: async () => {
        const publicId = get().userSearchResult?.publicId;
        if (publicId) return get().searchUser(publicId);
        return null;
      },

      clearUserSearch: () => {
        set({ userSearchResult: null });
      },

      getConversations: async () => {
        set({ isConversationsLoading: true });
        try {
          const res = await axiosInstance.get("/messages/conversations");
          set({ conversations: res.data });
        } catch (error) {
          console.log("Error in getConversations", error.message);
        } finally {
          set({ isConversationsLoading: false });
        }
      },

      getMessages: async (userId) => {
        if (!userId) return;
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({ messages: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load messages");
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        if (!selectedUser) return false;

        try {
          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
          set({ messages: [...messages, res.data], composerText: "" });
          get().getConversations();
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send message");
          return false;
        }
      },

      deleteConversation: async (userId) => {
        set({ isDeletingConversation: true });
        try {
          await axiosInstance.delete(`/messages/conversations/${userId}`);
          set((state) => ({
            conversations: state.conversations.filter((user) => user._id !== userId),
            ...(state.activeConversationId === userId
              ? { activeConversationId: null, selectedUser: null, messages: [] }
              : {}),
          }));
          toast.success("Chat history deleted. Your follow relationship is unchanged.");
          return true;
        } catch (error) {
          console.error("Error in deleteConversation:", error);
          toast.error(error.response?.data?.message || "Failed to delete chat");
          return false;
        } finally {
          set({ isDeletingConversation: false });
        }
      },

      downloadMedia: async (messageId, type) => {
        try {
          const response = await axiosInstance.get(`/messages/media/${messageId}/${type}`, {
            responseType: "blob",
          });
          const blobUrl = URL.createObjectURL(response.data);
          const extensionByType = {
            "image/avif": "avif",
            "image/gif": "gif",
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "video/mp4": "mp4",
            "video/quicktime": "mov",
            "video/webm": "webm",
          };
          const extension = extensionByType[response.data.type] || (type === "image" ? "jpg" : "mp4");
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `chat-media-${messageId}.${extension}`;
          document.body.append(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
          console.error("Error in downloadMedia:", error);
          toast.error(error.response?.data?.message || `Failed to download ${type}`);
        }
      },

      subscribeToMessages: (userId) => {
        if (!userId) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newMessage");
        socket.on("newMessage", (newMessage) => {
          // if im not the receiver don't do anything just return
          if (String(newMessage.senderId) !== String(userId)) return;

          set({ messages: [...get().messages, newMessage] });

          get().getConversations();
        });
      },

      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket?.off("newMessage");
      },

      setSelectedUser: (selectedUser) => set({ selectedUser }),

      setActiveConversationId: (activeConversationId) => {
        set((state) => ({
          activeConversationId,
          selectedUser:
            state.users.find((user) => user._id === activeConversationId) ||
            state.conversations.find((user) => user._id === activeConversationId) ||
            null,
          messages: activeConversationId ? state.messages : [],
        }));
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      setComposerText: (composerText) => set({ composerText }),
      setSoundEnabled: (isSoundEnabled) => set({ isSoundEnabled }),

      sendTextMessage: async (conversationId) => {
        const messageText = get().composerText.trim();
        if (!conversationId || !messageText) return false;

        return get().sendMessage({ text: messageText });
      },

      sendMediaMessage: async ({ conversationId, file }) => {
        if (!conversationId || !file) return false;

        const formData = new FormData();
        formData.append("media", file);

        set({ isSendingMedia: true });
        try {
          return await get().sendMessage(formData);
        } finally {
          set({ isSendingMedia: false });
        }
      },
    }),
    {
      name: "imessage-storage",
      partialize: (state) => ({ isSoundEnabled: state.isSoundEnabled }),
    },
  ),
);