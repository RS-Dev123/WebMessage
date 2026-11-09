import { Avatar, Button, TextArea } from "@heroui/react";
import { ImagePlusIcon, LoaderCircleIcon, SendIcon, VideoIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { getInitials } from "../../hooks/useSelectedConversation";

function StatusItem({ status }) {
  const author = status.userId;
  const time = new Date(status.createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="space-y-2 border-b border-border px-3 py-3">
      <div className="flex items-center gap-2">
        <Avatar className="size-9 shrink-0">
          <Avatar.Image alt={author.fullName} src={author.profilePic} />
          <Avatar.Fallback>{getInitials(author.fullName)}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{author.fullName}</p>
          <p className="text-xs text-muted">{time}</p>
        </div>
      </div>
      {status.image ? (
        <img
          src={status.image}
          alt={`Status from ${author.fullName}`}
          className="max-h-72 w-full rounded-xl object-contain"
          loading="lazy"
        />
      ) : null}
      {status.video ? (
        <video
          src={status.video}
          controls
          playsInline
          preload="metadata"
          className="max-h-72 w-full rounded-xl object-contain"
        />
      ) : null}
      {status.text ? <p className="whitespace-pre-wrap text-sm">{status.text}</p> : null}
    </article>
  );
}

export function StatusPanel() {
  const statuses = useChatStore((state) => state.statuses);
  const isStatusesLoading = useChatStore((state) => state.isStatusesLoading);
  const isPostingStatus = useChatStore((state) => state.isPostingStatus);
  const getStatuses = useChatStore((state) => state.getStatuses);
  const createStatus = useChatStore((state) => state.createStatus);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() && !file) return;

    const posted = await createStatus({ text, file });
    if (posted) {
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <form className="space-y-2 border-b border-border p-3" onSubmit={handleSubmit}>
        <TextArea
          fullWidth
          variant="secondary"
          rows={2}
          maxLength={500}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What's your status?"
        />
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            aria-label="Choose a status photo or video"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isDisabled={isPostingStatus}
            onPress={() => fileInputRef.current?.click()}
          >
            <ImagePlusIcon className="size-4" aria-hidden />
            <VideoIcon className="size-4" aria-hidden />
            {file ? file.name : "Photo or video"}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="ml-auto"
            isDisabled={isPostingStatus || (!text.trim() && !file)}
          >
            {isPostingStatus ? (
              <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
            ) : (
              <SendIcon className="size-4" aria-hidden />
            )}
            Share
          </Button>
        </div>
        <p className="text-xs text-muted">Visible to your followers and people you follow · 24 hours</p>
      </form>

      <div className="flex items-center justify-between px-3 pt-3">
        <h2 className="text-sm font-semibold">Recent status</h2>
        <Button
          variant="ghost"
          size="sm"
          isDisabled={isStatusesLoading}
          onPress={getStatuses}
        >
          Refresh
        </Button>
      </div>

      {statuses.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted">
          {isStatusesLoading ? "Loading statuses..." : "No active statuses from your connections."}
        </p>
      ) : (
        statuses.map((status) => <StatusItem key={status._id} status={status} />)
      )}
    </div>
  );
}
