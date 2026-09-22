import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";

// Add User Story
export const addUserStory = async (req, res) =>{
    try {
        const userId = req.authUserId || req.auth?.userId;
        const {content, media_type, background_color} = req.body;
        const media = req.file;
        let media_url = '';

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        if (!['text', 'image', 'video'].includes(media_type)) {
            return res.status(400).json({ success: false, message: 'Invalid story type' });
        }

        if ((media_type === 'image' || media_type === 'video') && !media) {
            return res.status(400).json({ success: false, message: 'Media file is required' });
        }

        // upload media to imagekit
        if(media_type === 'image' || media_type === 'video'){
            const response = await imagekit.files.upload({
                file: fs.createReadStream(media.path),
                fileName: media.originalname,
            });
            media_url = response.url;
        }
        // create story
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color
        })

        // schedule story deletion after 24 hours
        await inngest.send({
            name: 'app/story.delete',
            data: { storyId: story._id }
        })

        res.json({success: true})

    } catch (error) {
       console.log(error);
       res.json({ success: false, message: error.message }); 
    }
}

// Get User Stories
export const getStories = async (req, res) =>{
    try {
        const userId = req.authUserId || req.auth?.userId;
        const user = await User.findById(userId)

        const userIds = [userId];
        if (user) {
            userIds.push(...(user.connections || []), ...(user.following || []));
        }

        const stories = await Story.find({
            user: {$in: userIds},
            expiresAt: { $gt: new Date() }
        }).populate('user').sort({ createdAt: -1 });

        res.json({ success: true, stories }); 
    } catch (error) {
       console.log(error);
       res.json({ success: false, message: error.message }); 
    }
}

// Delete User Story
export const deleteUserStory = async (req, res) => {
    try {
        const userId = req.authUserId || req.auth?.userId;
        const { storyId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        if (!storyId) {
            return res.status(400).json({
                success: false,
                message: "Story ID is required"
            });
        }

        const story = await Story.findById(storyId);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found"
            });
        }

        // Only the owner can delete the story
        if (String(story.user) !== String(userId)) {
            return res.status(403).json({
                success: false,
                message: "You can delete only your own story"
            });
        }

        await Story.findByIdAndDelete(storyId);

        res.json({
            success: true,
            message: "Story deleted successfully"
        });

    } catch (error) {
        console.log("Delete Story Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};