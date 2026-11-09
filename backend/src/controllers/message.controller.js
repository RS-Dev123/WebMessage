import { Readable } from "node:stream";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

function getFollowStatus(viewer, profile) {
  const viewerId = String(viewer._id);
  const profileId = String(profile._id);

  if (viewer.following?.some((id) => String(id) === profileId)) return "following";
  if (viewer.sentFollowRequests?.some((id) => String(id) === profileId)) return "requested";
  if (profile.following?.some((id) => String(id) === viewerId)) return "followBack";
  return "follow";
}

function toPublicProfile(profile, followStatus) {
  return {
    _id: profile._id,
    publicId: profile.publicId,
    fullName: profile.fullName,
    profilePic: profile.profilePic,
    followStatus,
  };
}

export async function getUserByPublicId(req, res) {
  try {
    const publicId = req.params.publicId.trim().toUpperCase();
    const profile = await User.findOne({ publicId }).select(
      "_id publicId fullName profilePic following",
    );

    if (!profile || String(profile._id) === String(req.user._id)) {
      return res.status(404).json({ message: "No other account found with that user ID" });
    }

    const viewer = await User.findById(req.user._id).select(
      "following sentFollowRequests",
    );
    if (!viewer) return res.status(404).json({ message: "Your profile was not found" });

    res.status(200).json(toPublicProfile(profile, getFollowStatus(viewer, profile)));
  } catch (error) {
    console.error("Error in getUserByPublicId:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getFollowRequests(req, res) {
  try {
    const user = await User.findById(req.user._id).select("followRequests");
    const requests = await User.find({ _id: { $in: user.followRequests } }).select(
      "_id publicId fullName profilePic",
    );
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getFollowRequests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendFollowRequest(req, res) {
  try {
    const { id: targetId } = req.params;
    const requesterId = req.user._id;
    if (!mongoose.isValidObjectId(targetId) || String(targetId) === String(requesterId)) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const [target, requester] = await Promise.all([
      User.findById(targetId).select("_id following followRequests"),
      User.findById(requesterId).select("_id following sentFollowRequests"),
    ]);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (requester.following.some((id) => String(id) === String(targetId))) {
      return res.status(409).json({ message: "You already follow this user" });
    }
    if (target.followRequests.some((id) => String(id) === String(requesterId))) {
      return res.status(409).json({ message: "Follow request already sent" });
    }

    await Promise.all([
      User.updateOne({ _id: targetId }, { $addToSet: { followRequests: requesterId } }),
      User.updateOne({ _id: requesterId }, { $addToSet: { sentFollowRequests: targetId } }),
    ]);

    res.status(200).json({ message: "Follow request sent" });
  } catch (error) {
    console.error("Error in sendFollowRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function acceptFollowRequest(req, res) {
  try {
    const { id: requesterId } = req.params;
    const userId = req.user._id;
    if (!mongoose.isValidObjectId(requesterId) || String(requesterId) === String(userId)) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const accepted = await User.findOneAndUpdate(
      { _id: userId, followRequests: requesterId },
      {
        $pull: { followRequests: requesterId },
        $addToSet: { followers: requesterId },
      },
      { new: true },
    );
    if (!accepted) return res.status(404).json({ message: "Follow request not found" });

    await User.updateOne(
      { _id: requesterId },
      {
        $pull: { sentFollowRequests: userId },
        $addToSet: { following: userId },
      },
    );

    res.status(200).json({ message: "Follow request accepted" });
  } catch (error) {
    console.error("Error in acceptFollowRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function declineFollowRequest(req, res) {
  try {
    const { id: requesterId } = req.params;
    const userId = req.user._id;
    if (!mongoose.isValidObjectId(requesterId) || String(requesterId) === String(userId)) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const declined = await User.updateOne(
      { _id: userId, followRequests: requesterId },
      { $pull: { followRequests: requesterId } },
    );
    if (!declined.matchedCount) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    await User.updateOne(
      { _id: requesterId },
      { $pull: { sentFollowRequests: userId } },
    );

    res.status(200).json({ message: "Follow request declined" });
  } catch (error) {
    console.error("Error in declineFollowRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function unfollowUser(req, res) {
  try {
    const { id: targetId } = req.params;
    const userId = req.user._id;
    if (!mongoose.isValidObjectId(targetId) || String(targetId) === String(userId)) {
      return res.status(400).json({ message: "Invalid user" });
    }

    await Promise.all([
      User.updateOne(
        { _id: userId },
        { $pull: { following: targetId, sentFollowRequests: targetId } },
      ),
      User.updateOne(
        { _id: targetId },
        { $pull: { followers: userId, followRequests: userId } },
      ),
    ]);

    res.status(200).json({ message: "Unfollowed user" });
  } catch (error) {
    console.error("Error in unfollowUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getConversationsForSidebar(req, res) {
  try {
    const loggedInUserId = req.user._id;

    const conversations = await Message.aggregate([
      // 1. Keep only the messages I sent or received.
      {
        $match: {
          $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
          deletedFor: { $ne: loggedInUserId },
        },
      },
      // 2. Collapse them into one row per chat partner, noting our latest message time.
      {
        $group: {
          // The partner is the other person on the message (not me).
          _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
          lastMessageAt: { $max: "$createdAt" },
        },
      },
      // 3. Put the most recent conversation at the top.
      { $sort: { lastMessageAt: -1 } },
      // 4. Look up each partner's user profile (comes back as an array).
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      // 5. Pull that profile out of the array and make it the document.
      { $replaceRoot: { newRoot: { $first: "$user" } } },
      // 6. Hide the private clerkId field from the result.
      { $project: { clerkId: 0, email: 0 } },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getConversationsForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMessages(req, res) {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedFor: { $ne: myId },
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteConversation(req, res) {
  try {
    const { id: otherUserId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      {
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      { $addToSet: { deletedFor: userId } },
    );

    res.status(200).json({ message: "Chat deleted for you" });
  } catch (error) {
    console.error("Error in deleteConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function downloadMessageMedia(req, res) {
  try {
    const { id, type } = req.params;
    if (type !== "image" && type !== "video") {
      return res.status(400).json({ message: "Unsupported media type" });
    }

    const message = await Message.findOne({
      _id: id,
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    }).select("image video");

    const mediaUrl = message?.[type];
    if (!mediaUrl) {
      return res.status(404).json({ message: "Media not found" });
    }

    const url = new URL(mediaUrl);
    if (url.protocol !== "https:" || url.hostname !== "ik.imagekit.io") {
      return res.status(400).json({ message: "Unsupported media host" });
    }

    const mediaResponse = await fetch(url);
    if (!mediaResponse.ok || !mediaResponse.body) {
      return res.status(502).json({ message: "Failed to fetch media" });
    }

    const extension =
      url.pathname.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? (type === "image" ? ".jpg" : ".mp4");
    res.setHeader(
      "Content-Type",
      mediaResponse.headers.get("content-type") ?? "application/octet-stream",
    );
    res.setHeader("Content-Disposition", `attachment; filename="chat-media${extension}"`);
    const contentLength = mediaResponse.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    Readable.fromWeb(mediaResponse.body).pipe(res);
  } catch (error) {
    console.error("Error in downloadMessageMedia:", error.message);
    if (!res.headersSent) res.status(500).json({ message: "Internal server error" });
    else res.destroy(error);
  }
}

export async function sendMessage(req, res) {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let videoUrl;

    if (req.file) {
      if (!hasImageKitConfig()) {
        return res.status(500).json({ message: "Media upload is not configured" });
      }

      const url = await uploadChatMedia(req.file);
      if (req.file.mimetype.startsWith("video/")) videoUrl = url;
      else imageUrl = url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    // only send the message in realtime if user is online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}