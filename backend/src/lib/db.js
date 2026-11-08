import mongoose from "mongoose";

export async function connectDB() {
    try {
       const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/your-database-name";
       if(!mongoURI) {
        throw new Error("MONGO_URI is required");
       }
       const conn = await mongoose.connect(mongoURI);
       console.log("MonfoDB connected:", conn.connection.host);
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
}