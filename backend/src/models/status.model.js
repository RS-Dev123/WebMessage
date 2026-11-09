import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    image: String,
    video: String,
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
statusSchema.index({ userId: 1, expiresAt: -1 });

const Status = mongoose.model("Status", statusSchema);

export default Status;
