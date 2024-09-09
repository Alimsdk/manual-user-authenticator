import { app } from "./app.js";
import { connectDB } from "./db/index.js";
const PORT= process.env.PORT || 8000;

connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log('listening to PORT',PORT);
        
    })
    console.log("Successfully connected to DB");
    
}).catch((err)=>{
    console.log("Database Connection Failed",err);
    
})

