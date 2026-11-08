import express from "express";
import cors from "cors";
import "dotenv/config";
import fs from "fs"; //file system module for reading files
import path from "path"; //module for working with file and directory paths
import {clerkMiddleware} from "@clerk/express";
import User from "./models/user.model.js";
import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";

const app = express();
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

const publicDir = path.join(process.cwd(), "public"); //get the absolute path to the public directory

app.use(express.json());  //middleware for parsing JSON request bodies
app.use(cors({origin:FRONTEND_URL, credentials: true}));  //middleware
app.use(clerkMiddleware());  //middleware for Clerk authentication


app.get("/health", async (req, res) => {
    res.status(200).json({ ok:true });
});

if(fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));  //serve static files from the public directory

    app.get("/{*any}",(req,res,next) => {
        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
    })
}

app.listen(PORT,()=> {
    connectDB();
    console.log(`Server is up and running on port ${PORT}`);

    if(process.env.NODE_ENV === "production") job.start();
});
