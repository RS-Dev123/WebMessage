import { Avatar } from "@heroui/react";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

export function ConversationRow({ user, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mx-2 my-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
        selected
          ? "bg-violet-100/90 shadow-sm dark:bg-violet-400/15"
          : "hover:bg-violet-50/80 dark:hover:bg-white/[0.05]"
      }`}
    >
      <AvatarWithOnlineIndicator isOnline={user.isOnline ?? true}>
        <Avatar className="size-11 shrink-0 ring-2 ring-white dark:ring-white/10">
          <Avatar.Image alt={user.name} src={user.avatarUrl} />
          <Avatar.Fallback className="text-sm font-medium">{user.initials}</Avatar.Fallback>
        </Avatar>
      </AvatarWithOnlineIndicator>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{user.name}</p>
      </div>
    </button>
  );
}