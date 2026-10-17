import express from 'express'

import {
    getChatMessages,
    getUserRecentMessages,
    sendMessage,
    sseController
} from '../controllers/messageController.js'

import { upload } from '../configs/multer.js'

import protect from '../middlewares/auth.js';


const messageRouter = express.Router()


// Get recent messages
messageRouter.get(
    '/recent',
    protect,
    getUserRecentMessages
)


// SSE connection
messageRouter.get('/:userId', sseController)


// Send message
messageRouter.post(
    '/send',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'document', maxCount: 1 }
    ]),
    protect,
    sendMessage
)


// Get chat messages
messageRouter.post(
    '/get',
    protect,
    getChatMessages
)


export default messageRouter