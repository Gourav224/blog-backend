import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createPost, deletePost, getAllPosts, getPost, updatePost } from "../controllers/post.controller.js";


const router = Router();

router.use(verifyJWT)
//create post route

router.route("/create-Post").post(upload.single("featuredImage"), createPost);

//updatepost
router.route("/update-post").patch(upload.single("featuredImage"),updatePost);

//delete post
router.route('/delete-Post').post(deletePost);

//getsinglepost
router.route("/c/:slug").get(getPost);

// getallpost

router.route("/all-posts").get(getAllPosts);



export default router;