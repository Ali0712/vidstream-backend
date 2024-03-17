import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/User.model.js";

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "user register"
    // })

    const {email, fullName, password, username} = req.body;
    console.log(email, password)

    if ([email, fullName, password, username].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser){
        throw new ApiError(409, "User already exists")
    }

    req


})


export { registerUser }