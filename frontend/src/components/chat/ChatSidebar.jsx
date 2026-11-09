import { getInitials, useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { APP_NAME, AppLogo } from "../AppLogo";
import { UserButton } from "@clerk/react";

import { Avatar, Button, SearchField, Tabs } from "@heroui/react";
import {
  CheckIcon,
  Clock3Icon,
  CopyIcon,
  MessageSquareIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { ConversationRow } from "./ConversationRow";
import toast from "react-hot-toast";

function mapUserForList(user, onlineUsers) {
  return {
    conversationId: user._id,
    id: user._id,
    name: user.fullName,
    avatarUrl: user.profilePic,
    initials: getInitials(user.fullName),
    isOnline: onlineUsers.includes(user._id),
    peer: {
      name: user.fullName,
      avatarUrl: user.profilePic,
      initials: getInitials(user.fullName),
      isOnline: onlineUsers.includes(user._id),
    },
  };
}

function ChatSidebar() {
  const conversations = useChatStore((state) => state.conversations);
  const userSearchResult = useChatStore((state) => state.userSearchResult);
  const followRequests = useChatStore((state) => state.followRequests);
  const isSearchingUsers = useChatStore((state) => state.isSearchingUsers);
  const isUsersLoading = useChatStore((state) => state.isUsersLoading);
  const searchUser = useChatStore((state) => state.searchUser);
  const clearUserSearch = useChatStore((state) => state.clearUserSearch);
  const sendFollowRequest = useChatStore((state) => state.sendFollowRequest);
  const acceptFollowRequest = useChatStore((state) => state.acceptFollowRequest);
  const declineFollowRequest = useChatStore((state) => state.declineFollowRequest);
  const unfollowUser = useChatStore((state) => state.unfollowUser);

  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);

  const sidebarTab = useChatStore((state) => state.sidebarTab);
  const setSidebarTab = useChatStore((state) => state.setSidebarTab);

  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);

  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const authUser = useAuthStore((state) => state.authUser);
  const ownPublicId = authUser?.publicId;

  const { activeConversationId, isLargeScreen } = useSelectedConversation();

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const conversationUsers = conversations.map((user) => mapUserForList(user, onlineUsers));
  const filteredConversations = normalizedSearchQuery
    ? conversationUsers.filter((conversation) =>
        conversation.peer.name.toLowerCase().includes(normalizedSearchQuery),
      )
    : conversationUsers;

  const userResult = userSearchResult
    ? mapUserForList(userSearchResult, onlineUsers)
    : null;

  const handleUserSearch = (event) => {
    event.preventDefault();
    if (sidebarTab === "users") searchUser(searchQuery);
  };

  const handleCopyUserId = async () => {
    if (!ownPublicId) return;
    try {
      await navigator.clipboard.writeText(ownPublicId);
      toast.success("Your user ID was copied");
    } catch (error) {
      console.error("Failed to copy user ID:", error);
      toast.error("Could not copy your user ID");
    }
  };

  return (
    <aside
      className={`w-full shrink-0 flex-col overflow-hidden border-r border-border lg:w-72 ${
        !isLargeScreen && activeConversationId ? "hidden lg:flex" : "flex"
      }`}
    >
      <div className="shrink-0 border-b border-border px-2 pb-2 pt-2.5 sm:px-3 sm:pt-3">
        <div className="flex items-center gap-2 px-0.5 sm:gap-2.5 sm:px-1">
          <AppLogo size={32} className="size-8 shrink-0 rounded-[9px] sm:size-8.5" alt="" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold tracking-tight sm:text-[22px]">{APP_NAME}</p>
            <p className="truncate text-[10px] text-muted">Your ID: {ownPublicId || "Unavailable"}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className="shrink-0"
            isDisabled={!ownPublicId}
            aria-label={`Copy your user ID ${ownPublicId || ""}`}
            title={`Your user ID: ${ownPublicId || "Unavailable"}`}
            onPress={handleCopyUserId}
          >
            <CopyIcon className="size-4" aria-hidden />
          </Button>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </div>
      </div>

      <Tabs
        selectedKey={sidebarTab}
        onSelectionChange={(key) => {
          setSidebarTab(String(key));
          setSearchQuery("");
          clearUserSearch();
        }}
        variant="secondary"
        className="flex flex-1 flex-col overflow-y-auto"
      >
        <form className="shrink-0 border-b border-border px-3 pb-2 pt-2" onSubmit={handleUserSearch}>
          <SearchField
            fullWidth
            variant="secondary"
            className="w-full"
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              if (sidebarTab === "users" && !value) clearUserSearch();
            }}
          >
            <SearchField.Group className="rounded-xl">
              <SearchField.SearchIcon />
              <SearchField.Input
                placeholder={sidebarTab === "users" ? "Search by exact user ID" : "Search chats"}
              />
              {searchQuery ? (
                <SearchField.ClearButton
                  onPress={() => {
                    setSearchQuery("");
                    if (sidebarTab === "users") clearUserSearch();
                  }}
                />
              ) : null}
            </SearchField.Group>
          </SearchField>
          {sidebarTab === "users" ? (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              fullWidth
              className="mt-2"
              isDisabled={!searchQuery.trim() || isSearchingUsers}
            >
              {isSearchingUsers ? "Searching..." : "Find user"}
            </Button>
          ) : null}
        </form>

        <Tabs.ListContainer className="shrink-0 border-b border-border px-2 pb-2 pt-1">
          <Tabs.List className="w-full gap-0.5">
            <Tabs.Tab id="chats" className="flex-1 justify-center gap-1.5">
              <MessageSquareIcon className="size-3.5 opacity-80" aria-hidden />
              Chats
            </Tabs.Tab>
            <Tabs.Tab id="users" className="flex-1 justify-center gap-1.5">
              <UsersIcon className="size-3.5 opacity-80" aria-hidden />
              Users
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel
          id="chats"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          {filteredConversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No conversations match your search.
            </p>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                user={conversation}
                selected={conversation.id === activeConversationId}
                onSelect={() => setActiveConversationId(conversation.id)}
              />
            ))
          )}
        </Tabs.Panel>

        <Tabs.Panel id="users" className="flex-1 overflow-x-hidden overflow-y-auto outline-none">
          {followRequests.length > 0 ? (
            <section className="border-b border-border px-3 py-3">
              <h2 className="mb-2 text-sm font-semibold">Follow requests</h2>
              <div className="space-y-2">
                {followRequests.map((request) => (
                  <div key={request._id} className="flex items-center gap-2">
                    <Avatar className="size-9 shrink-0">
                      <Avatar.Image alt={request.fullName} src={request.profilePic} />
                      <Avatar.Fallback>{getInitials(request.fullName)}</Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{request.fullName}</p>
                      <p className="truncate text-xs text-muted">{request.publicId}</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      isDisabled={isUsersLoading}
                      aria-label={`Accept follow request from ${request.fullName}`}
                      onPress={() => acceptFollowRequest(request._id)}
                    >
                      <CheckIcon className="size-4" aria-hidden />
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      isDisabled={isUsersLoading}
                      aria-label={`Decline follow request from ${request.fullName}`}
                      onPress={() => declineFollowRequest(request._id)}
                    >
                      <XIcon className="size-4" aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {!userResult ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              Search for someone using their exact user ID. Your ID is {ownPublicId || "Unavailable"}.
            </p>
          ) : (
            <div className="flex items-center gap-2 border-b border-border px-3 py-3">
              <Avatar className="size-11 shrink-0">
                <Avatar.Image alt={userResult.name} src={userResult.avatarUrl} />
                <Avatar.Fallback>{userResult.initials}</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{userResult.name}</p>
                <p className="truncate text-xs text-muted">{userSearchResult.publicId}</p>
              </div>
              {userSearchResult.followStatus === "following" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => unfollowUser(userResult.id)}
                >
                  <CheckIcon className="size-4" aria-hidden />
                  Following
                </Button>
              ) : userSearchResult.followStatus === "requested" ? (
                <Button variant="secondary" size="sm" isDisabled>
                  <Clock3Icon className="size-4" aria-hidden />
                  Requested
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => sendFollowRequest(userResult.id)}
                >
                  <UserPlusIcon className="size-4" aria-hidden />
                  {userSearchResult.followStatus === "followBack" ? "Follow back" : "Follow"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setActiveConversationId(userResult.id)}
              >
                Message
              </Button>
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    </aside>
  );
}
export default ChatSidebar;