import express from "express";
import {
  createStatus,
  deleteConversation,
  downloadMessageMedia,
  getConversationsForSidebar,
  getRelationships,
  getMessages,
  getUserByPublicId,
  getStatuses,
  followUser,
  sendMessage,
  unfollowUser,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/users", (req, res) => {
  res.status(404).json({ message: "Use an exact user ID to find someone" });
});
router.get("/users/relationships", getRelationships);
router.get("/users/:publicId", getUserByPublicId);
router.post("/users/:id/follow", followUser);
router.delete("/users/:id/follow", unfollowUser);
router.get("/statuses", getStatuses);
router.post("/statuses", upload.single("media"), createStatus);
router.get("/conversations", getConversationsForSidebar);
router.delete("/conversations/:id", deleteConversation);
router.get("/media/:id/:type", downloadMessageMedia);
router.get("/:id", getMessages);
router.post("/send/:id", upload.single("media"), sendMessage);

export default router;