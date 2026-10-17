import express from "express";

import protect from "../middlewares/auth.js";
import upload from "../middlewares/Upload.js";

import {
    addPost,
    getFeedPosts,
    likePost,
    getLikedPeople,
    reactToPost,
    addComment,
    getComments,
    sharePost,
    deletePost,
    generateAICaptions,
    generateAIPersonality,
    generateAIPrediction,
    generateAIChat,
    generateAIInsights
} from "../controllers/postController.js";

const postRouter =
    express.Router();


// =====================================================
// CREATE POST
// =====================================================

postRouter.post(
    "/add",
    protect,
    upload.array("images", 5),
    addPost
);


// =====================================================
// AI CAPTION
// =====================================================

postRouter.post(
    "/ai-caption",
    protect,
    upload.single("media"),
    generateAICaptions
);


// =====================================================
// AI PERSONALITY
// =====================================================

postRouter.post(
    "/ai-personality",
    protect,
    generateAIPersonality
);


// =====================================================
// AI FUTURE PREDICTION
// =====================================================

postRouter.post(
    "/ai-predict",
    protect,
    generateAIPrediction
);


// =====================================================
// AI CHAT
// =====================================================

postRouter.post(
    "/ai-chat",
    protect,
    generateAIChat
);


// =====================================================
// AI PROFILE INSIGHTS
// =====================================================

postRouter.post(
    "/ai-insights",
    protect,
    generateAIInsights
);


// =====================================================
// GET FEED
// =====================================================

postRouter.get(
    "/feed",
    protect,
    getFeedPosts
);


// =====================================================
// OLD LIKE SYSTEM
// =====================================================

postRouter.post(
    "/like",
    protect,
    likePost
);


// =====================================================
// GET LIKED PEOPLE
// =====================================================

postRouter.get(
    "/liked-people",
    protect,
    getLikedPeople
);


// =====================================================
// NEW POST REACTION
// =====================================================

postRouter.post(
    "/react",
    protect,
    reactToPost
);


// =====================================================
// ADD COMMENT
// =====================================================

postRouter.post(
    "/comment",
    protect,
    addComment
);


// =====================================================
// GET COMMENTS
// =====================================================

postRouter.get(
    "/comments/:postId",
    protect,
    getComments
);


// =====================================================
// SHARE POST
// =====================================================

postRouter.post(
    "/share",
    protect,
    sharePost
);


// =====================================================
// DELETE POST
// =====================================================

postRouter.delete(
    "/delete/:postId",
    protect,
    deletePost
);


export default postRouter;