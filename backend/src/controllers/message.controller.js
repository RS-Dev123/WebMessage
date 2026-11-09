import { Readable } from "node:stream";
import mongoose from "mongoose";
import { clerkClient } from "@clerk/express";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { hasImageKitConfig, uploadChatMedia, uploadStatusMedia } from "../lib/imagekit.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Status from "../models/status.model.js";
import { getClerkUserProfile } from "../lib/clerk-user.js";

async function refreshPlaceholderProfile(profile) {
  if (profile.fullName !== "New user") return profile;

  const clerkUser = await clerkClient.users.getUser(profile.clerkId);
  const clerkProfile = getClerkUserProfile(clerkUser);
  const refreshed = await User.findOneAndUpdate(
    { _id: profile._id, fullName: "New user" },
    { $set: { fullName: clerkProfile.fullName, profilePic: clerkProfile.profilePic } },
    { returnDocument: "after" },
  ).select("_id publicId fullName profilePic followers");

  return (
    refreshed ??
    User.findById(profile._id).select("_id publicId fullName profilePic followers")
  );
}

function getFollowStatus(viewer, profile) {
  const profileId = String(profile._id);

  if (viewer.following?.some((id) => String(id) === profileId)) return "following";
  if (profile.followers?.some((id) => String(id) === String(viewer._id))) return "followBack";
  return "follow";
}

function toPublicProfile(profile, followStatus) {
  return {
    _id: profile._id,
    publicId: profile.publicId,
    fullName: profile.fullName,
    profilePic: refreshedById.get(String(profile._id))?.profilePic ?? profile.profilePic,
    followStatus,
  };
}

export async function getUserByPublicId(req, res) {
  try {
    const publicId = req.params.publicId.trim().toUpperCase();
    let profile = await User.findOne({ publicId }).select(
      "_id clerkId publicId fullName profilePic followers",
    );

    if (!profile || String(profile._id) === String(req.user._id)) {
      return res.status(404).json({ message: "No other account found with that user ID" });
    }

    profile = await refreshPlaceholderProfile(profile);

    const viewer = await User.findById(req.user._id).select("following");
    if (!viewer) return res.status(404).json({ message: "Your profile was not found" });

    res.status(200).json(toPublicProfile(profile, getFollowStatus(viewer, profile)));
  } catch (error) {
    console.error("Error in getUserByPublicId:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getRelationships(req, res) {
  try {
    const user = await User.findById(req.user._id).select("following followers");
    if (!user) return res.status(404).json({ message: "Your profile was not found" });

    const followingIds = user.following.map(String);
    const followerIds = user.followers.map(String);
    const [following, followers] = await Promise.all([
      User.find({ _id: { $in: followingIds } }).select(
        "_id clerkId publicId fullName profilePic",
      ),
      User.find({ _id: { $in: followerIds } }).select(
        "_id clerkId publicId fullName profilePic",
      ),
    ]);

    const refreshedProfiles = await Promise.all(
      [...following, ...followers].map(refreshPlaceholderProfile),
    );
    const refreshedById = new Map(
      refreshedProfiles.filter(Boolean).map((profile) => [String(profile._id), profile]),
    );
    const followedIds = new Set(followingIds);
    const mapProfile = (profile) => ({
      _id: profile._id,
      publicId: profile.publicId,
      fullName: refreshedById.get(String(profile._id))?.fullName ?? profile.fullName,
      profilePic: profile.profilePic,
      followStatus: followedIds.has(String(profile._id)) ? "following" : "follow",
    });

    res.status(200).json({
      followers: followers.map(mapProfile),
      following: following.map(mapProfile),
    });
  } catch (error) {
    console.error("Error in getRelationships:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function followUser(req, res) {
  try {
    const { id: targetId } = req.params;
    const userId = req.user._id;
    if (!mongoose.isValidObjectId(targetId) || String(targetId) === String(userId)) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const target = await User.findById(targetId).select("_id");
    if (!target) return res.status(404).json({ message: "User not found" });

    await Promise.all([
      User.updateOne({ _id: targetId }, { $addToSet: { followers: userId } }),
      User.updateOne({ _id: userId }, { $addToSet: { following: targetId } }),
    ]);

    res.status(200).json({ message: "User followed" });
  } catch (error) {
    console.error("Error in followUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getStatuses(req, res) {
  try {
    const user = await User.findById(req.user._id).select("following followers");
    if (!user) return res.status(404).json({ message: "Your profile was not found" });

    const visibleUserIds = new Set([
      String(user._id),
      ...user.following.map(String),
      ...user.followers.map(String),
    ]);

    const statuses = await Status.find({
      userId: { $in: [...visibleUserIds] },
      expiresAt: { $gt: new Date() },
    })
      .populate("userId", "publicId fullName profilePic")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error in getStatuses:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createStatus(req, res) {
  try {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    if (text.length > 500) {
      return res.status(400).json({ message: "Status text must be 500 characters or fewer" });
    }
    if (!text && !req.file) {
      return res.status(400).json({ message: "Add text, a photo, or a video to your status" });
    }

    let image;
    let video;
    if (req.file) {
      if (!hasImageKitConfig()) {
        return res.status(500).json({ message: "Media upload is not configured" });
      }

      const url = await uploadStatusMedia(req.file);
      if (req.file.mimetype.startsWith("video/")) video = url;
      else image = url;
    }

    const status = await Status.create({
      userId: req.user._id,
      text,
      image,
      video,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.status(201).json(status);
  } catch (error) {
    console.error("Error in createStatus:", error.message);
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
        { $pull: { following: targetId } },
      ),
      User.updateOne(
        { _id: targetId },
        { $pull: { followers: userId } },
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