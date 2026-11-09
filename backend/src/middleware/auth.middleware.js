import { clerkClient, getAuth } from "@clerk/express";
import User from "../models/user.model.js";
import { getClerkUserProfile } from "../lib/clerk-user.js";

export async function protectRoute(req, res, next) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const profile = getClerkUserProfile(clerkUser);

      user = await User.findOneAndUpdate(
        { clerkId: userId },
        { $setOnInsert: profile },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}