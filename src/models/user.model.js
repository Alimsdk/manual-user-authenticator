import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';

const userSchema= new mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    email:{
        type:String,
        unique: true,
        trim:true
    },
    phone:{
        type: String,
        required:true,
        unique:true,
        index:true,
        trim:true
    },
    address:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true,
        minLength:6,
        match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
    // This regex ensures the password has at least one lowercase letter,
    // one uppercase letter, and one digit with a minimum of 6 characters.

    },
    refreshToken: {
        type: String
    }
},{timestamps:true});

userSchema.pre("save", async function(next){
    //   if(!this.isModified("password")) return next();
     this.password = await bcrypt.hash(this.password,10);
     next();
});

userSchema.methods.isPasswordCorrect=async function(password){
    console.log('eta pailam',password,this.password);
    
     const passwordStatus= await bcrypt.compare(password,this.password);
     console.log(passwordStatus);
     return passwordStatus;
     
};

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            phone: this.phone
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User= mongoose.model('User',userSchema);