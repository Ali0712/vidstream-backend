import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.route("/register", registerUser)

export {userRouter}