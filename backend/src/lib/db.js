import mongoose from "mongoose";
import User from "../models/user.model.js";
import { createPublicUserId } from "./public-user-id.js";

export async function connectDB() {
    try {
       const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/your-database-name";
       if(!mongoURI) {
        throw new Error("MONGO_URI is required");
       }
       const conn = await mongoose.connect(mongoURI);
       const indexes = await User.collection.indexes();
       const legacyEmailIndexes = indexes.filter(
           (index) => index.key.email === 1 && index.unique && !index.partialFilterExpression,
       );

       for (const index of legacyEmailIndexes) {
           await User.collection.dropIndex(index.name);
       }

       await User.collection.createIndex(
           { email: 1 },
           {
               unique: true,
               partialFilterExpression: { email: { $type: "string" } },
               name: "email_unique_partial",
           },
       );

       await User.collection.createIndex(
           { publicId: 1 },
           {
               unique: true,
               partialFilterExpression: { publicId: { $type: "string" } },
               name: "public_id_unique",
           },
       );

       const usersWithoutPublicId = await User.collection
           .find(
               { $or: [{ publicId: { $exists: false } }, { publicId: null }] },
               { projection: { _id: 1 } },
           )
           .toArray();

       for (const user of usersWithoutPublicId) {
           await User.collection.updateOne(
               { _id: user._id, $or: [{ publicId: { $exists: false } }, { publicId: null }] },
               { $set: { publicId: createPublicUserId() } },
           );
       }

       const usersWithPendingRequests = await User.collection
           .find(
               { followRequests: { $exists: true, $ne: [] } },
               { projection: { _id: 1, followRequests: 1 } },
           )
           .toArray();
       const followMigrations = [];

       for (const recipient of usersWithPendingRequests) {
           for (const requesterId of recipient.followRequests ?? []) {
               if (String(requesterId) === String(recipient._id)) continue;

               followMigrations.push(
                   {
                       updateOne: {
                           filter: { _id: recipient._id },
                           update: { $addToSet: { followers: requesterId } },
                       },
                   },
                   {
                       updateOne: {
                           filter: { _id: requesterId },
                           update: { $addToSet: { following: recipient._id } },
                       },
                   },
               );
           }
       }

       if (followMigrations.length > 0) {
           await User.collection.bulkWrite(followMigrations, { ordered: false });
       }

       await User.collection.updateMany(
           {},
           { $unset: { followRequests: "", sentFollowRequests: "" } },
       );

       console.log("MonfoDB connected:", conn.connection.host);
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
}
