import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config('./.env');

export const connectDB=async()=>{
    try {
        console.log(process.env.MONGODB_URI);
        
            const response=await mongoose.connect(`${process.env.MONGODB_URI}/VIDEOPIE`);
        console.log('Connected to DB:',response.connection.host);
        
    } catch (error) {
        console.log("Database Connection Error:",error);
        process.exit(1);
    }
}

