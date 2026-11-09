import mongoose from 'mongoose';
import { createPublicUserId } from "../lib/public-user-id.js";


const userSchema = new mongoose.Schema({
    clerkId:{
        type: String,
        required: true,
        unique: true,
    },
    publicId: {
        type: String,
        required: true,
        default: createPublicUserId,
        immutable: true,
    },
    email:{
        type: String,
        trim: true,
    },
    fullName:{
        type: String,
        required: true,
    },
    profilePic:{
        type: String,
        default: "",
    },
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    followRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    sentFollowRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
},{timestamps: true});

userSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: { email: { $type: "string" } },
        name: "email_unique_partial",
    },
);
userSchema.index(
    { publicId: 1 },
    {
        unique: true,
        partialFilterExpression: { publicId: { $type: "string" } },
        name: "public_id_unique",
    },
);

const User = mongoose.model("User", userSchema);

export default User;