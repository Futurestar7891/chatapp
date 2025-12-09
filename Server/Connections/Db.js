import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config({});
export const connectDB=async()=>{
    try {

           const options = {
             maxPoolSize: 10, // Max 10 connections in pool (optimal for most apps)
             minPoolSize: 5, // Keep 5 connections ready
             serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
             socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
             family: 4, // Use IPv4, skip IPv6
           };

        await mongoose.connect(process.env.DB_URL,options);
        console.log("Database Connected");
    } catch (error) {
        console.log("Connection Failed",error);
    }
}





