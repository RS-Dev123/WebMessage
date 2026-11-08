import express from "express";
import cors from "cors";
import "dotenv/config";
import {clerkMiddleware} from "@clerk/express";
import User from "./models/user.model.js";
import { connectDB } from "./lib/db.js";


const app = express();
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(express.json());  //middleware for parsing JSON request bodies
app.use(cors({origin:FRONTEND_URL, credentials: true}));  //middleware
app.use(clerkMiddleware());  //middleware for Clerk authentication


app.get("/health", async (req, res) => {
    res.status(200).json({ ok:true });
});

app.listen(PORT,()=> {
    connectDB();
    console.log(`Server is up and running on port ${PORT}`);
});
