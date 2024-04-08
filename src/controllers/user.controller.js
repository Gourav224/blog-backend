import asyncHandler from "../utils/asyncHandlers.js";
import ApiError from "../utils/apiError.js"
import { User } from "../models/user.models.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateRefreshAndAccessToken = async (userId) => {
    try {
        let user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        user = await User.findById(userId);
        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}



const registerUser = asyncHandler(async (req, res) => {
    // get user deatils form frontend
    // validation - notempty
    // check if user already exists : username
    // check for images , check for avator 
    // upload them ro cloudinary ,avatar
    // create user object - create  entery in db
    // remove pass word and refresh token field form resprose
    // check for user creation
    // return res
    console.log(req.body)
    const { email, fullName, password } = req.body;
    // email = email.toLowerCase();
    // email=String(email);
    // console.log(email, fullName, password);

    if (
        [fullName, email, password].some((field) => {
            return field?.trim() === "";
        })
    ) {
        throw new ApiError(400, 'All fields are required');
    }

    const existedUser = await User.findOne({email});

    if (existedUser) {
        throw new ApiError(409, "User with email  already exists");
    }

    const user = await User.create({
        fullName,
        password,
        email
    });


    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!userCreated) {
        throw new ApiError(500, "Something went wrong when creating the user ");
    }
    return res.status(201).json(
        new ApiResponse(200, userCreated, "user created Sucessfully")
    );
})


const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie 
    // send res


    const { email, password } = req.body;
    // email = email.toLowerCase();
    // console.log(email,  password);
    if (!email) {
        throw new ApiError(400, "Email is Required");
    }
    if (!password) {
        throw new ApiError(400, "Password  is Required");
    }

    const user = await User.findOne({email});

    if (!user) {
        throw new ApiError(404, "user does not exist");
    }

    const isPasswordvalid = await user.isPasswordCorrect(password);

    if (!isPasswordvalid) {
        throw new ApiError(401, "Invalid user password");
    }
    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(user._id);


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true,

    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in Successfully"
            )
        );
})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out Successfully")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {

        const decodedTokem = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedTokem?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, refreshToken } = await generateRefreshAndAccessToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken,
                    },
                    "Access token refreshed Successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})


const getCurrrentUser = asyncHandler(async (req, res) => {

    if(!req.user){
        throw new ApiError(401,"unauthorized request")
    }
    const user = req.user;
    return res.status(200).json(
        new ApiResponse(
            200, {
            user,
        },
            "Current user fetched sucessfully"
        )
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrrentUser,
}