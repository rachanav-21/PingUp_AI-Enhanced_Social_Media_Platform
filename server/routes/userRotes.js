import express from 'express';

import {
  acceptConnectionRequest,
  discoverUsers,
  followUser,
  getUserConnections,
  getUserData,
  getUserProfiles,
  sendConnectionRequest,
  unfollowUser,
  updateUserData
} from '../controllers/userController.js';

import protect from '../middlewares/auth.js';

import { upload } from '../configs/multer.js';

import { getUserRecentMessages } from '../controllers/messageController.js';

const userRouter = express.Router();

// =====================================================
// GET LOGGED-IN USER DATA
// =====================================================

userRouter.get(
  '/data',
  protect,
  getUserData
);

// =====================================================
// UPDATE USER DATA
// =====================================================

userRouter.post(
  '/update',
  protect,
  upload.fields([
    {
      name: 'profile',
      maxCount: 1
    },
    {
      name: 'cover',
      maxCount: 1
    }
  ]),
  updateUserData
);

// =====================================================
// DISCOVER USERS
// =====================================================

userRouter.post(
  '/discover',
  protect,
  discoverUsers
);

// =====================================================
// FOLLOW USER
// =====================================================

userRouter.post(
  '/follow',
  protect,
  followUser
);

// =====================================================
// UNFOLLOW USER
// =====================================================

userRouter.post(
  '/unfollow',
  protect,
  unfollowUser
);

// =====================================================
// SEND CONNECTION REQUEST
// =====================================================

userRouter.post(
  '/connect',
  protect,
  sendConnectionRequest
);

// =====================================================
// ACCEPT CONNECTION REQUEST
// =====================================================

userRouter.post(
  '/accept',
  protect,
  acceptConnectionRequest
);

// =====================================================
// GET USER CONNECTIONS
// =====================================================

userRouter.get(
  '/connections',
  protect,
  getUserConnections
);

// =====================================================
// GET USER PROFILE + POSTS
// IMPORTANT: frontend calls /profile/:userId
// =====================================================

userRouter.get(
  '/profile/:userId',
  protect,
  getUserProfiles
);

// =====================================================
// RECENT MESSAGES
// =====================================================

userRouter.get(
  '/recent-messages',
  protect,
  getUserRecentMessages
);

export default userRouter;