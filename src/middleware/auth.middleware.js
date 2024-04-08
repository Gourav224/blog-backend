import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandlers.js";
import { User } from "../models/user.models.js"


export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // console.log(req.cookies);

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
        // console.log(req.cookies);
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken -createdAt -updatedAt -__v");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user;

        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
})