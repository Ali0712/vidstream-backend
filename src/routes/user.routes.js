import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserDetails, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register")
    .post(upload.fields([
            {
                name: "avatar",
                maxCount: 1
            }, {
                name: "coverImage",
                maxCount: 1,
            }
        ]), registerUser);

userRouter.route("/login").post(loginUser)

userRouter.route("/logout").post(verifyJWT, logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword)
userRouter.route("/user-details").get(verifyJWT, getCurrentUser)
userRouter.route("/update-user-details").patch(verifyJWT, updateUserDetails)
userRouter.route("/watch-history").get(verifyJWT, getWatchHistory)

export { userRouter }