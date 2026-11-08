import express from "express";
import User from "./models/user.model.js";
import {verifyWebhook} from "@clerk/backend/webhooks";

const router = express.Router();

router.post("/", async (req, res) => {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    
}

export default router;