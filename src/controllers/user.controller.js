import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';

const options={
    httpOnly:true,
    secure:true
}

const generateAccessAndRefreshToken=async(userId)=>{
   
       try {
         const user=await User.findById(userId);
 
         if(!user){
             throw new ApiError(404,"user ke khuje paini")
         }
         const accessToken = user.generateAccessToken();
         const refreshToken= user.generateRefreshToken();
         
         user.refreshToken = refreshToken;
 
         await user.save({validateBeforeSave:false});
 
         return {accessToken,refreshToken}
      
       } catch (error) {
         throw new ApiError(500, "Something went wrong while generating referesh and access token")
       }   
  
}

const registerUser=asyncHandler(async(req,res)=>{
    // first recieve the sent data from user
    // check if required inputs are filled
    //  check if the user already exists
    // hide the encrypted password & refresh token while sending back response to user

    const {name,email,phone,address,password}= req.body;    

    if(
        [name,phone,address,password].some(field=> field.trim() === "")
    ){
        throw new ApiError(400,"Please fill all the data in the form");
    }

    const existedUser=await User.findOne({
        $or:[{phone},{email}]
    });

    if(existedUser){
         throw new ApiError(409,"user with this phone or email exists");
    }

    const user= await User.create({name,email,phone,address,password});

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    );
    
});

const loginUser = asyncHandler(async(req,res)=>{
    // req body --> data
    //  email or phone
    // find the user
    // password check
    // access and refresh
    // send cookie

    const {email,phone,password} = req.body;    

    if(!phone && !email){
        throw new ApiError(400,"phone or email is required");
    }
       
    const user=await User.findOne(
       {
         $or:[{phone},{email}]
       }
    );    

    if(!user){
        throw new ApiError(404,"User doesn't exist!")
    }

   const isPasswordValid= await user.isPasswordCorrect(password);

   if(!isPasswordValid){
    throw new ApiError(401,"Invalid User Credentials");
   }

     const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id);

     const loggedInUser=await User.findById(user._id);

    //  const options={
    //     httpOnly:true,
    //     secure:true
    //  }

     return res.
     status(200).
     cookie("accessToken",accessToken,options).
     cookie("refreshToken",refreshToken,options)
     .json(
        new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User logged In Successfully")
     )

});

const logOutUser= asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        }
    );

    // const options={
    //     httpOnly:true,
    //     secure:true
    // }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out"))
});

const refreshAccessToken=asyncHandler(async(re,res)=>{

   try {
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken) {
     throw new ApiError(401,"unauthorized request");
    }
 
    const decodedToken=jwt.verify(
     incomingRefreshToken,
     process.env.refreshAccessToken
    );
 
    const user= await User.findById(decodedToken._id);
 
    if(!user){
     throw new ApiError(401,"Invalid refresh Token");
    }
 
    if(incomingRefreshToken != user?.refreshToken){
     throw new ApiError(401,"Refresh token is expired");
    }
 
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);
    
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
     200,
     {accessToken,refreshToken},
     "Access Token Refreshed"
    ))
   } catch (error) {
     throw new ApiError(401, error.message || "Invalid Refresh Token")
   }
});

export {registerUser, loginUser, logOutUser,refreshAccessToken}