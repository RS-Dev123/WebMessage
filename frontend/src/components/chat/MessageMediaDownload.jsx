import { Button } from "@heroui/react";
import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { useChatStore } from "../../store/useChatStore";

export function MessageMediaDownload({ messageId, type }) {
  const downloadMedia = useChatStore((state) => state.downloadMedia);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadMedia(messageId, type);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      isDisabled={isDownloading}
      className="mt-1 h-7 min-w-0 justify-start gap-1 px-1.5 text-xs"
      aria-label={`Download ${type}`}
      onPress={handleDownload}
    >
      {isDownloading ? (
        <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <DownloadIcon className="size-3.5" aria-hidden />
      )}
      Download {type}
    </Button>
  );
}
