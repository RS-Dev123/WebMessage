import express from "express";
import "dotenv/config";
import User from "./models/user.model.js";
import { connectDB } from "./lib/db.js";
import {clerkMiddleware} from "@clerk/express";


const app = express();

const PORT = process.env.PORT;

app.use(express.json());

app.use(clerkMiddleware());


app.get("/health", async (req, res) => {
    res.status(200).json({ ok:true });
});

app.listen(PORT,()=> {
    connectDB();
    console.log(`Server is up and running on port ${PORT}`);
});
