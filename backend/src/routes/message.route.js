import express from "express";
import {
  acceptFollowRequest,
  deleteConversation,
  declineFollowRequest,
  downloadMessageMedia,
  getConversationsForSidebar,
  getFollowRequests,
  getMessages,
  getUserByPublicId,
  sendMessage,
  sendFollowRequest,
  unfollowUser,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/users", (req, res) => {
  res.status(404).json({ message: "Use an exact user ID to find someone" });
});
router.get("/users/follow-requests", getFollowRequests);
router.get("/users/:publicId", getUserByPublicId);
router.post("/users/:id/follow", sendFollowRequest);
router.post("/users/:id/follow/accept", acceptFollowRequest);
router.post("/users/:id/follow/decline", declineFollowRequest);
router.delete("/users/:id/follow", unfollowUser);
router.get("/conversations", getConversationsForSidebar);
router.delete("/conversations/:id", deleteConversation);
router.get("/media/:id/:type", downloadMessageMedia);
router.get("/:id", getMessages);
router.post("/send/:id", upload.single("media"), sendMessage);

export default router;