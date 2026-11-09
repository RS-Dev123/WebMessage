import { withTransform } from "../../lib/imagekit";
import { MessageVideo } from "./MessageVideo";
import { MessageMediaDownload } from "./MessageMediaDownload";

// Compress + size images for the bubble (q-auto works for images; f-auto picks WebP/AVIF).
const IMAGE_TRANSFORM = "q-auto,w-640,f-auto";

export function MessageBubble({ message }) {
  const isOwnMessage = message.role === "me";
  const hasImage = Boolean(message.imageUrl);
  const hasVideo = Boolean(message.videoUrl);

  return (
    <div className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(90%,32rem)] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug shadow-sm sm:max-w-[min(75%,32rem)] sm:px-4 ${
          isOwnMessage
            ? "rounded-br-md bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/15"
            : "rounded-bl-md border border-violet-950/5 bg-white/90 dark:border-white/10 dark:bg-white/[0.07]"
        }`}
      >
        {hasImage ? (
          <>
            <img
              src={withTransform(message.imageUrl, IMAGE_TRANSFORM)}
              alt=""
              className="mb-1.5 max-h-40 max-w-full rounded-lg object-cover sm:max-h-52 sm:rounded-xl"
            />
            <MessageMediaDownload messageId={message.id} type="image" />
          </>
        ) : null}
        {hasVideo ? (
          <>
            <MessageVideo src={message.videoUrl} />
            <MessageMediaDownload messageId={message.id} type="video" />
          </>
        ) : null}
        {message.text ? (
          <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p>
        ) : null}
        <p
          className={`mt-1 text-[11px] tabular-nums ${
            isOwnMessage ? "text-white/70" : "text-muted"
          }`}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}