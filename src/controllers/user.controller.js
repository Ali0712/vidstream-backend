import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessTokenAndRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { email, fullName, password, username } = req.body;

    if ([email, fullName, password, username].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required 1")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required 2")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user !")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully !")
    )
})

const loginUser = asyncHandler(async (req, res) => {

    const { email, username, password } = req.body;
    if (!email && !username) {
        throw new ApiError(400, "Username or Email is required !")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User does not exists !")
    }

    const validPassword = await user.isPasswordCorrect(password);
    if (!validPassword) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = { httpOnly: true, secure: true }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            { user: loggedInUser, accessToken, refreshToken},
            "User logged in successfully !"))
})

const logoutUser = asyncHandler(async(req, res)=> {
    await User.findByIdAndUpdate(req.user._id,{
        $unset: {refreshToken: 1}
    },{
        new : true
    })
    const options = { httpOnly: true, secure: true }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if (!user){
            throw new ApiError(401, "Invalid refresh token")
        }

        if (token !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired")
        }

        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

        const options = { httpOnly: true, secure: true };
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken)
            .json(new ApiResponse(200, {accessToken, refreshToken}, "Access token refreshed"));

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res.status(200).json(new ApiResponse(200, req.user, "user fetched successfully"))
})

const updateUserDetails = asyncHandler(async(req, res)=>{
    const {fullName} = req.body;
    if (!fullName){
        throw new ApiError(400, "Full name is required")
    }
    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {fullName}
    },{
        new: true
    }).select("-password -refreshToken")

    return res.status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"))

})

const getWatchHistory = asyncHandler(async(req, res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1

                                    }
                                }
                            ]
                        }   
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                        
                            }
                    }}
                ]
                
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))  
})

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    getWatchHistory
}