import User from "../models/User.js";

import Post from "../models/Post.js";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import fs from "fs";

import imagekit from "../configs/imagekit.js";


// =====================================================
// IMAGEKIT UPLOAD HELPER
// =====================================================

const uploadToImageKit = async (file, folder) => {
  if (!file) {
    return null;
  }

  try {
    console.log("Uploading file to ImageKit:", file.originalname);

    const result = await imagekit.files.upload({
      file: fs.createReadStream(file.path),
      fileName: file.originalname,
      folder: folder
    });

    console.log("ImageKit upload successful:", result.url);

    // Delete temporary Multer file
    try {
      fs.unlinkSync(file.path);
      console.log("Temporary file deleted:", file.path);
    } catch (deleteError) {
      console.log(
        "Temporary file delete warning:",
        deleteError.message
      );
    }

    return result.url;
  } catch (error) {
    console.error(
      "IMAGEKIT UPLOAD ERROR:",
      error
    );

    // Try to delete temporary file even when upload fails
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (deleteError) {
      console.log(
        "Temporary file cleanup error:",
        deleteError.message
      );
    }

    throw error;
  }
};


// =====================================================
// GET USER DATA
// =====================================================

export const getUserData = async (req, res) => {
  try {
    const userId =
      req.authUserId ||
      req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const user = await User.findById(userId)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error(
      "GET USER DATA ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get user data"
    });
  }
};


// =====================================================
// UPDATE USER DATA
// =====================================================

export const updateUserData = async (req, res) => {
  try {
    const userId =
      req.authUserId ||
      req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    console.log("=================================");
    console.log("UPDATE USER DATA");
    console.log("Authenticated User ID:", userId);
    console.log("Request Body:", req.body);
    console.log(
      "Uploaded Files:",
      req.files
        ? Object.keys(req.files)
        : "No files"
    );
    console.log("=================================");

    const {
      full_name,
      username,
      bio,
      location
    } = req.body;

    const updateData = {};

    // =================================================
    // TEXT DATA
    // =================================================

    if (full_name !== undefined) {
      updateData.full_name = full_name;
    }

    if (username !== undefined) {
      updateData.username = username;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (location !== undefined) {
      updateData.location = location;
    }


    // =================================================
    // PROFILE IMAGE
    // =================================================

    if (
      req.files &&
      req.files.profile &&
      req.files.profile.length > 0
    ) {
      const profileFile =
        req.files.profile[0];

      console.log(
        "Profile image received:",
        profileFile.originalname
      );

      const profileUrl =
        await uploadToImageKit(
          profileFile,
          "pingup/profile"
        );

      if (profileUrl) {
        updateData.profile_picture =
          profileUrl;
      }
    }


    // =================================================
    // COVER IMAGE
    // =================================================

    if (
      req.files &&
      req.files.cover &&
      req.files.cover.length > 0
    ) {
      const coverFile =
        req.files.cover[0];

      console.log(
        "Cover image received:",
        coverFile.originalname
      );

      const coverUrl =
        await uploadToImageKit(
          coverFile,
          "pingup/cover"
        );

      if (coverUrl) {
        updateData.cover_photo =
          coverUrl;
      }
    }


    // =================================================
    // UPDATE USER IN MONGODB
    // =================================================

    console.log(
      "MongoDB Update Data:",
      updateData
    );

    const user =
      await User.findByIdAndUpdate(
        userId,
        updateData,
        {
          new: true,
          runValidators: true
        }
      ).select("-password");


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }


    console.log(
      "User updated successfully"
    );

    console.log(
      "Profile Picture:",
      user.profile_picture
    );

    console.log(
      "Cover Photo:",
      user.cover_photo
    );


    res.json({
      success: true,
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    console.error(
      "UPDATE USER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update profile"
    });
  }
};


// =====================================================
// DISCOVER USERS
// =====================================================

export const discoverUsers = async (req, res) => {
  try {
    const userId =
      req.authUserId ||
      req.auth?.userId;

    const search = (
      req.body.input ||
      req.body.search ||
      ""
    ).trim();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!search) {
      return res.json({
        success: true,
        users: []
      });
    }

    const escapedSearch =
      search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const users = await User.find({
      _id: {
        $ne: userId
      },
      $or: [
        {
          username: {
            $regex: `^${escapedSearch}`,
            $options: "i"
          }
        },
        {
          full_name: {
            $regex: `^${escapedSearch}`,
            $options: "i"
          }
        }
      ]
    })
      .select(
        "_id email username full_name bio profile_picture cover_photo location isVerified followers following connections pendingConnections"
      )
      .limit(50)
      .lean();

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error(
      "DISCOVER USERS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to search users"
    });
  }
};


// =====================================================
// FOLLOW USER
// =====================================================

export const followUser = async (req, res) => {
  try {
    const userId =
      req.authUserId ||
      req.auth?.userId;

    const targetUserId =
      req.body.userId ||
      req.body.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    if (
      String(userId) ===
      String(targetUserId)
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself"
      });
    }

    const currentUser =
      await User.findById(userId);

    const targetUser =
      await User.findById(targetUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found"
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    if (!currentUser.following) {
      currentUser.following = [];
    }

    if (!targetUser.followers) {
      targetUser.followers = [];
    }

    const alreadyFollowing =
      currentUser.following.some(
        id =>
          String(id) ===
          String(targetUserId)
      );

    if (alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message:
          "You are already following this user"
      });
    }

    currentUser.following.push(
      targetUserId
    );

    targetUser.followers.push(
      userId
    );

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message:
        "User followed successfully"
    });

  } catch (error) {
    console.error(
      "FOLLOW USER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to follow user"
    });
  }
};


// =====================================================
// UNFOLLOW USER
// =====================================================

export const unfollowUser = async (req, res) => {
  try {
    const userId =
      req.authUserId ||
      req.auth?.userId;

    const targetUserId =
      req.body.userId ||
      req.body.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const currentUser =
      await User.findById(userId);

    const targetUser =
      await User.findById(targetUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found"
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    if (!currentUser.following) {
      currentUser.following = [];
    }

    if (!targetUser.followers) {
      targetUser.followers = [];
    }

    currentUser.following =
      currentUser.following.filter(
        id =>
          String(id) !==
          String(targetUserId)
      );

    targetUser.followers =
      targetUser.followers.filter(
        id =>
          String(id) !==
          String(userId)
      );

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message:
        "User unfollowed successfully"
    });

  } catch (error) {
    console.error(
      "UNFOLLOW USER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to unfollow user"
    });
  }
};


// =====================================================
// SEND CONNECTION REQUEST
// =====================================================

export const sendConnectionRequest = async (
  req,
  res
) => {
  try {
    const userId =
      req.authUserId ||
      req.auth?.userId;

    const targetUserId =
      req.body.userId ||
      req.body.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message:
          "Target user ID is required"
      });
    }

    if (
      String(userId) ===
      String(targetUserId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot connect with yourself"
      });
    }

    const currentUser =
      await User.findById(userId);

    const targetUser =
      await User.findById(targetUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message:
          "Current user not found"
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message:
          "Target user not found"
      });
    }

    if (!currentUser.connections) {
      currentUser.connections = [];
    }

    if (!targetUser.connections) {
      targetUser.connections = [];
    }

    if (!targetUser.pendingConnections) {
      targetUser.pendingConnections = [];
    }

    const alreadyConnected =
      targetUser.connections.some(
        id =>
          String(id) ===
          String(userId)
      );

    if (alreadyConnected) {
      return res.status(400).json({
        success: false,
        message:
          "You are already connected"
      });
    }

    const alreadyPending =
      targetUser.pendingConnections.some(
        id =>
          String(id) ===
          String(userId)
      );

    if (alreadyPending) {
      return res.status(400).json({
        success: false,
        message:
          "Connection request already sent"
      });
    }

    targetUser.pendingConnections.push(
      userId
    );

    await targetUser.save();

    res.json({
      success: true,
      message:
        "Connection request sent"
    });

  } catch (error) {
    console.error(
      "SEND CONNECTION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to send connection request"
    });
  }
};


// =====================================================
// GET USER CONNECTIONS
// =====================================================

export const getUserConnections = async (
  req,
  res
) => {
  try {
    const userId =
      req.authUserId ||
      req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User not authenticated"
      });
    }

    const user =
      await User.findById(userId)
        .populate({
          path: "followers",
          select:
            "_id username full_name bio profile_picture cover_photo location isVerified"
        })
        .populate({
          path: "following",
          select:
            "_id username full_name bio profile_picture cover_photo location isVerified"
        })
        .populate({
          path: "pendingConnections",
          select:
            "_id username full_name bio profile_picture cover_photo location isVerified"
        })
        .populate({
          path: "connections",
          select:
            "_id username full_name bio profile_picture cover_photo location isVerified"
        })
        .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const followers =
      Array.isArray(user.followers)
        ? user.followers
        : [];

    const following =
      Array.isArray(user.following)
        ? user.following
        : [];

    const pendingConnections =
      Array.isArray(
        user.pendingConnections
      )
        ? user.pendingConnections
        : [];

    const connections =
      Array.isArray(user.connections)
        ? user.connections
        : [];

    res.json({
      success: true,
      followers,
      following,
      pendingConnections,
      connections,
      counts: {
        followers:
          followers.length,
        following:
          following.length,
        pending:
          pendingConnections.length,
        connections:
          connections.length
      }
    });

  } catch (error) {
    console.error(
      "GET CONNECTIONS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get connections"
    });
  }
};


// =====================================================
// ACCEPT CONNECTION REQUEST
// =====================================================

export const acceptConnectionRequest = async (
  req,
  res
) => {
  try {
    const userId =
      req.authUserId ||
      req.auth?.userId;

    const requestUserId =
      req.body.userId ||
      req.body.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User not authenticated"
      });
    }

    if (!requestUserId) {
      return res.status(400).json({
        success: false,
        message:
          "Request user ID is required"
      });
    }

    const currentUser =
      await User.findById(userId);

    const requestUser =
      await User.findById(
        requestUserId
      );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message:
          "Current user not found"
      });
    }

    if (!requestUser) {
      return res.status(404).json({
        success: false,
        message:
          "Request user not found"
      });
    }

    if (!currentUser.pendingConnections) {
      currentUser.pendingConnections = [];
    }

    if (!currentUser.connections) {
      currentUser.connections = [];
    }

    if (!requestUser.connections) {
      requestUser.connections = [];
    }

    const requestExists =
      currentUser.pendingConnections.some(
        id =>
          String(id) ===
          String(requestUserId)
      );

    if (!requestExists) {
      return res.status(400).json({
        success: false,
        message:
          "No pending connection request found"
      });
    }

    currentUser.pendingConnections =
      currentUser.pendingConnections.filter(
        id =>
          String(id) !==
          String(requestUserId)
      );

    const currentAlreadyConnected =
      currentUser.connections.some(
        id =>
          String(id) ===
          String(requestUserId)
      );

    if (!currentAlreadyConnected) {
      currentUser.connections.push(
        requestUserId
      );
    }

    const requestAlreadyConnected =
      requestUser.connections.some(
        id =>
          String(id) ===
          String(userId)
      );

    if (!requestAlreadyConnected) {
      requestUser.connections.push(
        userId
      );
    }

    await currentUser.save();
    await requestUser.save();

    res.json({
      success: true,
      message:
        "Connection accepted successfully"
    });

  } catch (error) {
    console.error(
      "ACCEPT CONNECTION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to accept connection"
    });
  }
};


// =====================================================
// GET USER PROFILE + POSTS
// =====================================================

export const getUserProfiles = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required"
      });
    }

    const user =
      await User.findById(userId)
        .select("-password")
        .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found"
      });
    }

    const posts =
      await Post.find({
        user: userId
      })
        .populate({
          path: "user",
          select:
            "_id username full_name profile_picture isVerified"
        })
        .sort({
          createdAt: -1
        })
        .lean();

    res.json({
      success: true,
      user,
      posts
    });

  } catch (error) {
    console.error(
      "GET USER PROFILE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get user profile"
    });
  }
};