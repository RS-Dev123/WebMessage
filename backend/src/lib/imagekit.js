import ImageKit, { toFile } from "@imagekit/nodejs";

const imagekit = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });

function hasImageKitConfig() {
  return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
}

// originalName= "My Photo (1).png"
// result: "chat-1749300000000-My_Photo__1_.png"
// this helper makes a safe, unique filename for uploaded files.
function createFileName(originalName = "upload") {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `chat-${Date.now()}-${safeName}`;
}

async function uploadMedia(file, folder, prefix) {
  const fileName = createFileName(file.originalname).replace(/^chat-/, `${prefix}-`);

  const result = await imagekit.files.upload({
    file: await toFile(file.buffer, fileName, { type: file.mimetype }),
    fileName,
    folder,
  });

  return result.url;
}

const uploadChatMedia = (file) => uploadMedia(file, "/chat", "chat");
const uploadStatusMedia = (file) => uploadMedia(file, "/status", "status");

export { uploadChatMedia, uploadStatusMedia, hasImageKitConfig };