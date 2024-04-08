import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandlers.js";
import { uploadOnCloudinary, deleteformCloudinary } from "../utils/cloudinary.js"
import { Post } from "../models/post.models.js"
import { User } from "../models/user.models.js";


/* The `createPost` function is an asynchronous handler that handles the creation of a new post. Here
is a breakdown of what the function does: */

const createPost = asyncHandler(async (req, res) => {

    const { title, content, isPublished, slug, userID } = req.body;

    const featuredImageLocalPath = req.file?.path;

    if (
        [title, content, isPublished, featuredImageLocalPath, slug, userID].some((field) => {
            return field?.trim() === "";
        })
    ) {
        throw new ApiError(400, "All fields are requied");
    }

    const userexist = await User.findById(userID);

    if (!userexist) {
        throw new ApiError(404, "user does not exist");
    }


    const featuredImage = await uploadOnCloudinary(featuredImageLocalPath);

    if (!featuredImage) {
        throw new ApiError(409, "featured image required");
    }

    const post = await Post.create({
        title,
        content,
        slug,
        featuredImage: featuredImage.url,
        author: userID,
        isPublished
    });

    const createdPost = await Post.findById(post._id);

    if (!createdPost) {
        throw new ApiError(500, "Something went wrong while creating post");
    }

    return res.status(200).json(
        new ApiResponse(200, post, "Postcreated sucessfully")
    )
});
/* The `deletePost` function is an asynchronous handler that handles the deletion of a post. Here is a
breakdown of what the function does: */

const deletePost = asyncHandler(async (req, res) => {
    const { slug, userID } = req.body;
    if (
        [slug, userID].some((field) => {
            return field.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required");
    }
    const userexist = await User.findById(userID);

    if (!userexist) {
        throw new ApiError(404, "user does not exist");
    }
    const post = await Post.find({ slug });
    console.log(post);
    if (!post) {
        throw new ApiError(404, "Post does not exist");
    }
    const deletefeaturedImage = await deleteformCloudinary(post.featuredImage);
    console.log(deletefeaturedImage)
    if (!deletefeaturedImage) {
        throw new ApiError(500, "Internal server Error");
    }
    const deletedPost = await Post.deleteOne(post._id);
    console.log(deletePost)
    if (!deletedPost) {
        throw new ApiError(500, "Internal server Error");
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "Post deleted successfully")
    );
});




const updatePost = asyncHandler(async (req, res) => {

    const { title, content, isPublished, postId, slug, userID } = req.body;
    // console.log(content)
    console.log( title, content, isPublished, postId, slug, userID );
    const featuredImageLocalPath = req.file?.path;
    if (
        [title, content, isPublished, featuredImageLocalPath, postId, slug, userID].some((field) => {
            return field?.trim() === "";
        })
    ) {
        throw new ApiError(400, "All fields are required");
    }
    const userexist = await User.findById(userID);
    if (!userexist) {
        throw new ApiError(404, "user does not exist");
    }
    const post = await Post.findById(postId);
    // console.log(post)
    const deletefeaturedImage = await deleteformCloudinary(post.featuredImage);

    if (!deletefeaturedImage) {
        throw new ApiError(500, "Internal server Error");
    }

    const featuredImage = await uploadOnCloudinary(featuredImageLocalPath);

    if (!featuredImage) {
        throw new ApiError(409, "featured image required");
    }
    const updatedPost = await Post.findByIdAndUpdate(
        post._id,
        {
            $set: {
                title,
                content:content,
                isPublished:isPublished || true,
                featuredImage: featuredImage.url,
                slug: slug || post.slug,
            },
        }
    );
    console.log(updatedPost);

    if (!updatedPost) {
        throw new ApiError(500, "Something went wrong while updating post");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPost, "Post updated sucessfully")
    )
});



const getPost = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    if (!slug?.trim()) {
        throw new ApiError(400, 'Slug field cannot be empty');
    }
    const post = await Post.findOne({ slug });
    if (!post) {
        throw new ApiError(404, 'No post found');
    }
    console.log("post", post);
    return res.status(200).json(new ApiResponse(200, post, "Post retrieved successfully"));
});




const getAllPosts = asyncHandler(async (req, res) => {
    // Retrieve all published posts using aggregation
    const posts = await Post.aggregate([
        {
            $match: {
                isPublished: true
            }
        }
    ]);

    // Log the retrieved posts for debugging purposes
    // console.log('posts', posts[0]);

    // Check if there are no published posts
    if (posts.length === 0) {
        // If no posts found, throw a 404 error
        throw new ApiError(404, 'No published posts available');
    }

    // Return a JSON response with the retrieved posts
    return res.status(200).json(new ApiResponse(200, posts, "All published posts retrieved successfully"));
});

// Add comments to explain the purpose of the function

export {
    createPost,
    deletePost,
    updatePost,
    getPost,
    getAllPosts,
}