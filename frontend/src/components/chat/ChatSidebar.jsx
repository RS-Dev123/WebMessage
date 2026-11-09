import { getInitials, useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { APP_NAME, AppLogo } from "../AppLogo";
import { UserButton } from "@clerk/react";
import { useState } from "react";

import { Avatar, Button, SearchField, Tabs } from "@heroui/react";
import {
  CheckIcon,
  CopyIcon,
  CircleDotIcon,
  MessageSquareIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { ConversationRow } from "./ConversationRow";
import { StatusPanel } from "./StatusPanel";
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
  const followers = useChatStore((state) => state.followers);
  const following = useChatStore((state) => state.following);
  const isSearchingUsers = useChatStore((state) => state.isSearchingUsers);
  const searchUser = useChatStore((state) => state.searchUser);
  const clearUserSearch = useChatStore((state) => state.clearUserSearch);
  const followUser = useChatStore((state) => state.followUser);
  const unfollowUser = useChatStore((state) => state.unfollowUser);

  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);

  const sidebarTab = useChatStore((state) => state.sidebarTab);
  const setSidebarTab = useChatStore((state) => state.setSidebarTab);
  const [peopleSection, setPeopleSection] = useState("followers");

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
    if (sidebarTab === "people" && peopleSection === "find") searchUser(searchQuery);
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
      className={`w-full shrink-0 flex-col overflow-hidden border-r border-violet-950/8 bg-white/45 dark:border-white/10 dark:bg-white/[0.02] lg:w-80 ${
        !isLargeScreen && activeConversationId ? "hidden lg:flex" : "flex"
      }`}
    >
      <div className="shrink-0 border-b border-violet-950/8 px-3 pb-3 pt-3 dark:border-white/10 sm:px-4 sm:pt-4">
        <div className="flex items-center gap-2 px-0.5 sm:gap-2.5 sm:px-1">
          <AppLogo size={36} className="size-9 shrink-0 rounded-xl shadow-sm shadow-violet-500/15" alt="" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold tracking-tight">{APP_NAME}</p>
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
        {sidebarTab === "chats" || (sidebarTab === "people" && peopleSection === "find") ? (
          <form
            className="shrink-0 border-b border-border px-3 pb-2 pt-2"
            onSubmit={handleUserSearch}
          >
            <SearchField
              fullWidth
              variant="secondary"
              className="w-full"
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                if (sidebarTab === "people" && !value) clearUserSearch();
              }}
            >
              <SearchField.Group className="rounded-2xl border-0 bg-slate-100/85 shadow-inner dark:bg-white/[0.06]">
                <SearchField.SearchIcon />
                <SearchField.Input
                  placeholder={
                    sidebarTab === "people" ? "Search by exact user ID" : "Search chats"
                  }
                />
                {searchQuery ? (
                  <SearchField.ClearButton
                    onPress={() => {
                      setSearchQuery("");
                      if (sidebarTab === "people") clearUserSearch();
                    }}
                  />
                ) : null}
              </SearchField.Group>
            </SearchField>
            {sidebarTab === "people" && peopleSection === "find" ? (
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
        ) : null}

        <Tabs.ListContainer className="shrink-0 border-b border-violet-950/8 px-3 pb-2.5 pt-2 dark:border-white/10">
          <Tabs.List className="w-full gap-1 rounded-2xl bg-slate-100/80 p-1 dark:bg-white/[0.06]">
            <Tabs.Tab id="chats" className="flex-1 justify-center gap-1">
              <MessageSquareIcon className="size-3.5 opacity-80" aria-hidden />
              Chats
            </Tabs.Tab>
            <Tabs.Tab id="people" className="flex-1 justify-center gap-1">
              <UsersIcon className="size-3.5 opacity-80" aria-hidden />
              People
            </Tabs.Tab>
            <Tabs.Tab id="status" className="flex-1 justify-center gap-1">
              <CircleDotIcon className="size-3.5 opacity-80" aria-hidden />
              Status
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

        <Tabs.Panel id="people" className="flex-1 overflow-x-hidden overflow-y-auto outline-none">
          <div className="flex border-b border-border p-2">
            <Button
              variant={peopleSection === "followers" ? "primary" : "ghost"}
              size="sm"
              className="flex-1"
              onPress={() => setPeopleSection("followers")}
            >
              Followers ({followers.length})
            </Button>
            <Button
              variant={peopleSection === "following" ? "primary" : "ghost"}
              size="sm"
              className="flex-1"
              onPress={() => setPeopleSection("following")}
            >
              Following ({following.length})
            </Button>
            <Button
              variant={peopleSection === "find" ? "primary" : "ghost"}
              size="sm"
              className="flex-1"
              onPress={() => setPeopleSection("find")}
            >
              Find
            </Button>
          </div>

          {peopleSection === "find" ? (
            !userResult ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                Search for someone using their exact user ID. Your ID is {ownPublicId || "Unavailable"}.
              </p>
            ) : (
              <div className="flex items-center gap-2 border-b border-border px-3 py-3">
                <Avatar className="size-11 shrink-0">
                  <Avatar.Image alt={userResult.name} src={userResult.avatarUrl} />
                  <Avatar.Fallback>{userResult.initials}</Avatar.Fallback>
                </Avatar>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setActiveConversationId(userResult.id)}
                >
                  <p className="truncate text-sm font-semibold">{userResult.name}</p>
                  <p className="truncate text-xs text-muted">{userSearchResult.publicId}</p>
                </button>
                <Button
                  variant={userSearchResult.followStatus === "following" ? "secondary" : "primary"}
                  size="sm"
                  onPress={() =>
                    userSearchResult.followStatus === "following"
                      ? unfollowUser(userResult.id)
                      : followUser(userResult.id)
                  }
                >
                  {userSearchResult.followStatus === "following" ? (
                    <>
                      <CheckIcon className="size-4" aria-hidden />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="size-4" aria-hidden />
                      {userSearchResult.followStatus === "followBack" ? "Follow back" : "Follow"}
                    </>
                  )}
                </Button>
              </div>
            )
          ) : (
            (() => {
              const people = peopleSection === "followers" ? followers : following;
              if (!people.length) {
                return (
                  <p className="px-4 py-6 text-center text-sm text-muted">
                    {peopleSection === "followers"
                      ? "No followers yet."
                      : "You are not following anyone yet."}
                  </p>
                );
              }

              return people.map((person) => {
                const user = mapUserForList(person, onlineUsers);
                const isFollowing = person.followStatus === "following";

                return (
                  <div
                    key={person._id}
                    className="flex items-center gap-2 border-b border-border px-3 py-2"
                  >
                    <Avatar className="size-10 shrink-0">
                      <Avatar.Image alt={person.fullName} src={person.profilePic} />
                      <Avatar.Fallback>{user.initials}</Avatar.Fallback>
                    </Avatar>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setActiveConversationId(person._id)}
                    >
                      <p className="truncate text-sm font-semibold">{person.fullName}</p>
                      <p className="truncate text-xs text-muted">{person.publicId}</p>
                    </button>
                    <Button
                      variant={isFollowing ? "secondary" : "primary"}
                      size="sm"
                      onPress={() =>
                        isFollowing ? unfollowUser(person._id) : followUser(person._id)
                      }
                    >
                      {isFollowing ? (
                        <>
                          <CheckIcon className="size-4" aria-hidden />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="size-4" aria-hidden />
                          Follow back
                        </>
                      )}
                    </Button>
                  </div>
                );
              });
            })()
          )}
        </Tabs.Panel>

        <Tabs.Panel id="status" className="flex-1 overflow-x-hidden overflow-y-auto outline-none">
          <StatusPanel />
        </Tabs.Panel>
      </Tabs>
    </aside>
  );
}
export default ChatSidebar;