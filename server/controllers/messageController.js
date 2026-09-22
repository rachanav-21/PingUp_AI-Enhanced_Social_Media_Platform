import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";

// Create an empty object to store SSE connections
const connections = {};

// Controller function for the SSE endpoint
export const sseController = (req, res) => {

    const { userId } = req.params;

    console.log('New client connected : ', userId);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Store client connection
    connections[userId] = res;

    // Send initial event
    res.write('log: Connected to SSE stream\n\n');

    // Handle client disconnection
    req.on('close', () => {

        delete connections[userId];

        console.log('Client disconnected');
    });
};


// Send Message
export const sendMessage = async (req, res) => {

    try {

        const userId = req.authUserId || req.auth?.userId;

        const {
            to_user_id,
            text,
            message_type: requestedMessageType,
            media_url: requestedMediaUrl
        } = req.body;

        const image = req.files?.image?.[0];
        const document = req.files?.document?.[0];

        let media_url = requestedMediaUrl || '';
        let message_type = requestedMessageType || 'text';


        // Image message
        if (image) {

            message_type = 'image';

            const response = await imagekit.files.upload({
                file: fs.createReadStream(image.path),
                fileName: image.originalname,
            });

            media_url = imagekit.helper.buildSrc({
                urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
                src: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' }
                ]
            });
        }


        // Document message
        else if (document) {

            message_type = 'document';

            const response = await imagekit.files.upload({
                file: fs.createReadStream(document.path),
                fileName: document.originalname,
            });

            media_url = response.url || response.filePath || '';
        }


        // Create message
        const message = await Message.create({

            from_user_id: userId,

            to_user_id,

            text,

            message_type,

            media_url

        });


        // Send response
        res.json({
            success: true,
            message
        });


        // Populate sender information
        const messageWithUserData =
            await Message.findById(message._id)
                .populate('from_user_id');


        // Send message using SSE
        if (connections[to_user_id]) {

            connections[to_user_id].write(
                `data: ${JSON.stringify(messageWithUserData)}\n\n`
            );

        }

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: error.message
        });
    }
};


// Get Chat Messages
export const getChatMessages = async (req, res) => {

    try {

        const userId = req.authUserId || req.auth?.userId;

        const { to_user_id } = req.body;


        const messages = await Message.find({

            $or: [

                {
                    from_user_id: userId,
                    to_user_id
                },

                {
                    from_user_id: to_user_id,
                    to_user_id: userId
                }

            ]

        }).sort({ createdAt: -1 });


        // Mark received messages as seen
        await Message.updateMany(

            {
                from_user_id: to_user_id,
                to_user_id: userId
            },

            {
                seen: true
            }

        );


        res.json({
            success: true,
            messages
        });


    } catch (error) {

        res.json({
            success: false,
            message: error.message
        });

    }
};


// Get User Recent Messages
export const getUserRecentMessages = async (req, res) => {

    try {

        const userId = req.authUserId || req.auth?.userId;


        // Get BOTH received and sent messages
        const messages = await Message.find({

            $or: [

                {
                    from_user_id: userId
                },

                {
                    to_user_id: userId
                }

            ]

        })
        .populate('from_user_id')
        .populate('to_user_id')
        .sort({ createdAt: -1 });


        res.json({
            success: true,
            messages
        });


    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: error.message
        });

    }
};