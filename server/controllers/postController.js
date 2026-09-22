import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";

import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri
} from "@google/genai";

import fs from "fs/promises";
import os from "os";
import path from "path";


// =====================================================
// GEMINI CONFIGURATION
// =====================================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const GEMINI_MODEL =
    process.env.GEMINI_MODEL || "gemini-3.7-flash";


// =====================================================
// CREATE POST
// =====================================================

export const addPost = async (req, res) => {
    try {
        const userId =
            req.authUserId || req.auth?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const {
            content,
            post_type,
            publishAt
        } = req.body;

        let image_urls = [];
        let captions = [];

        if (req.body.captions) {
            try {
                captions =
                    JSON.parse(
                        req.body.captions
                    );

                if (!Array.isArray(captions)) {
                    captions = [];
                }
            } catch {
                captions = [];
            }
        }

        if (
            req.files &&
            req.files.length > 0
        ) {
            for (
                let index = 0;
                index < req.files.length;
                index++
            ) {
                const file =
                    req.files[index];

                if (
                    !file.buffer ||
                    !file.buffer.length
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Uploaded file is empty"
                    });
                }

                const base64File =
                    file.buffer.toString(
                        "base64"
                    );

                const result =
                    await imagekit.files.upload({
                        file: base64File,
                        fileName:
                            file.originalname
                    });

                if (
                    result &&
                    result.url
                ) {
                    image_urls.push({
                        url: result.url,

                        caption:
                            typeof captions[index] ===
                            "string"
                                ? captions[index].trim()
                                : ""
                    });
                }
            }
        }

        if (
            (!content ||
                !content.trim()) &&
            image_urls.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Post content or image is required"
            });
        }

        const postData = {
            user: userId,

            content:
                content
                    ? content.trim()
                    : "",

            image_urls,

            post_type:
                post_type || "text"
        };

        if (publishAt) {
            const publishDate =
                new Date(publishAt);

            if (
                !isNaN(
                    publishDate.getTime()
                )
            ) {
                postData.publishAt =
                    publishDate;
            }
        }

        const post =
            await Post.create(
                postData
            );

        return res.status(201).json({
            success: true,

            message:
                "Post created successfully",

            post
        });

    } catch (error) {
        console.error(
            "ADD POST ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                error.message ||
                "Failed to create post"
        });
    }
};


// =====================================================
// AI CAPTION GENERATOR
// =====================================================

export const generateAICaptions = async (
    req,
    res
) => {
    let temporaryFilePath = null;

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

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Image or video is required"
            });
        }

        if (
            !process.env.GEMINI_API_KEY
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Gemini API key is not configured"
            });
        }

        const file =
            req.file;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
            "video/webm"
        ];

        if (
            !allowedTypes.includes(
                file.mimetype
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only image and video files are supported"
            });
        }

        if (
            file.mimetype.startsWith(
                "video/"
            ) &&
            file.size >
                20 * 1024 * 1024
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Video must be smaller than 20MB for AI captions"
            });
        }

        const prompt = `
Analyze this image or video and create exactly 5 different social media caption suggestions for PingUp.

Requirements:
- Make every caption unique.
- Keep captions natural and engaging.
- Match the actual visual content.
- Suitable for Instagram-style social media.
- Mix aesthetic, funny, emotional, trendy, and short styles when appropriate.
- Do not explain the image or video.
- Do not add numbering.
- Return ONLY a JSON array containing exactly 5 caption strings.
`;

        let response;

        // IMAGE
        if (
            file.mimetype.startsWith(
                "image/"
            )
        ) {
            const base64Data =
                file.buffer.toString(
                    "base64"
                );

            response =
                await generateWithRetry(
                    () =>
                        ai.models.generateContent({
                            model:
                                GEMINI_MODEL,

                            contents: [
                                {
                                    role:
                                        "user",

                                    parts: [
                                        {
                                            inlineData: {
                                                mimeType:
                                                    file.mimetype,

                                                data:
                                                    base64Data
                                            }
                                        },

                                        {
                                            text:
                                                prompt
                                        }
                                    ]
                                }
                            ],

                            config: {
                                responseMimeType:
                                    "application/json",

                                thinkingConfig: {
                                    thinkingLevel:
                                        "low"
                                }
                            }
                        })
                );

        } else {

            // VIDEO
            const safeFileName =
                `${Date.now()}-${file.originalname
                    .replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    )}`;

            temporaryFilePath =
                path.join(
                    os.tmpdir(),
                    safeFileName
                );

            await fs.writeFile(
                temporaryFilePath,
                file.buffer
            );

            let videoFile =
                await ai.files.upload({
                    file:
                        temporaryFilePath,

                    config: {
                        mimeType:
                            file.mimetype
                    }
                });

            let attempts = 0;
            const maxAttempts = 60;

            while (
                videoFile &&
                videoFile.state &&
                videoFile.state
                    .toString()
                    .toUpperCase() !==
                    "ACTIVE"
            ) {
                const currentState =
                    videoFile.state
                        .toString()
                        .toUpperCase();

                if (
                    currentState ===
                    "FAILED"
                ) {
                    throw new Error(
                        "Gemini failed to process the video"
                    );
                }

                attempts++;

                if (
                    attempts >
                    maxAttempts
                ) {
                    throw new Error(
                        "Video processing took too long"
                    );
                }

                await sleep(3000);

                videoFile =
                    await ai.files.get({
                        name:
                            videoFile.name
                    });
            }

            response =
                await generateWithRetry(
                    () =>
                        ai.models.generateContent({
                            model:
                                GEMINI_MODEL,

                            contents:
                                createUserContent([
                                    createPartFromUri(
                                        videoFile.uri,
                                        videoFile.mimeType
                                    ),

                                    prompt
                                ]),

                            config: {
                                responseMimeType:
                                    "application/json",

                                thinkingConfig: {
                                    thinkingLevel:
                                        "low"
                                }
                            }
                        })
                );
        }

        const text =
            getGeminiText(
                response
            );

        if (!text) {
            throw new Error(
                "AI did not return any captions"
            );
        }

        let captions = [];

        try {
            captions =
                JSON.parse(
                    text
                        .replace(
                            /```json/gi,
                            ""
                        )
                        .replace(
                            /```/g,
                            ""
                        )
                        .trim()
                );

        } catch {
            captions =
                text
                    .split("\n")
                    .map(
                        line =>
                            line
                                .replace(
                                    /^\d+[.)]\s*/,
                                    ""
                                )
                                .replace(
                                    /^[-*]\s*/,
                                    ""
                                )
                                .replace(
                                    /^["']|["']$/g,
                                    ""
                                )
                                .trim()
                    )
                    .filter(Boolean)
                    .slice(0, 5);
        }

        if (
            !Array.isArray(
                captions
            )
        ) {
            throw new Error(
                "Invalid caption response from AI"
            );
        }

        captions =
            captions
                .filter(
                    caption =>
                        typeof caption ===
                            "string" &&
                        caption.trim()
                )
                .map(
                    caption =>
                        caption.trim()
                )
                .slice(0, 5);

        if (
            captions.length === 0
        ) {
            throw new Error(
                "No caption suggestions generated"
            );
        }

        return res.status(200).json({
            success: true,
            captions
        });

    } catch (error) {
        console.error(
            "AI CAPTION ERROR:",
            error
        );

        const status =
            Number(
                error?.status ||
                error?.statusCode ||
                error?.response?.status
            );

        if (status === 429) {
            return res.status(503).json({
                success: false,
                message:
                    "Gemini AI is handling many requests right now. Please try again shortly."
            });
        }

        if (status === 503) {
            return res.status(503).json({
                success: false,
                message:
                    "Gemini AI is temporarily unavailable. Please try again shortly."
            });
        }

        if (status === 404) {
            return res.status(404).json({
                success: false,
                message:
                    `Gemini model "${GEMINI_MODEL}" is unavailable.`
            });
        }

        if (
            status === 401 ||
            status === 403
        ) {
            return res.status(status).json({
                success: false,
                message:
                    "Gemini API authentication failed. Check your GEMINI_API_KEY."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to generate AI captions"
        });

    } finally {
        if (temporaryFilePath) {
            try {
                await fs.unlink(
                    temporaryFilePath
                );
            } catch {}
        }
    }
};


// =====================================================
// AI PERSONALITY ANALYSIS
// =====================================================

export const generateAIPersonality = async (
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

        if (
            !process.env.GEMINI_API_KEY
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Gemini API key is not configured"
            });
        }

        const posts =
            await Post.find({
                user: userId
            })
                .sort({
                    createdAt: -1
                })
                .limit(20)
                .lean();

        if (!posts.length) {
            return res.status(200).json({
                success: true,

                personality: {
                    title:
                        "Your personality is waiting to be discovered ✨",

                    summary:
                        "Create a few posts and PingUp AI will analyze your content style.",

                    traits: [
                        "Creative",
                        "Social",
                        "Expressive"
                    ],

                    contentStyle:
                        "Not enough posts yet",

                    recommendation:
                        "Create more posts to unlock personalized AI insights."
                }
            });
        }

        const postData =
            posts.map(
                (post, index) => ({
                    postNumber:
                        index + 1,

                    content:
                        post.content ||
                        "",

                    postType:
                        post.post_type ||
                        "text",

                    images:
                        Array.isArray(
                            post.image_urls
                        )
                            ? post.image_urls.length
                            : 0,

                    likes:
                        Array.isArray(
                            post.likes_count
                        )
                            ? post.likes_count.length
                            : 0,

                    comments:
                        Number(
                            post.comments_count ||
                            0
                        ),

                    shares:
                        Number(
                            post.share_count ||
                            0
                        )
                })
            );

        const prompt = `
You are PingUp AI, a social media personality analyst.

Analyze the user's recent social media activity below.

DATA:
${JSON.stringify(
    postData,
    null,
    2
)}

Give a fun but useful personality analysis based ONLY on their content and engagement behavior.

Return ONLY valid JSON in exactly this format:

{
    "title": "short creative personality title",
    "summary": "2 sentence summary",
    "traits": [
        "trait 1",
        "trait 2",
        "trait 3",
        "trait 4"
    ],
    "contentStyle": "short description of their posting style",
    "recommendation": "one practical recommendation for their future posts"
}

Rules:
- Do not diagnose mental health.
- Do not make sensitive personal assumptions.
- Keep it positive and entertaining.
- Traits must be related to social media behavior.
- Do not include markdown.
`;

        const response =
            await generateWithRetry(
                () =>
                    ai.models.generateContent({
                        model:
                            GEMINI_MODEL,

                        contents:
                            prompt,

                        config: {
                            responseMimeType:
                                "application/json",

                            thinkingConfig: {
                                thinkingLevel:
                                    "low"
                            }
                        }
                    })
            );

        const text =
            getGeminiText(
                response
            );

        if (!text) {
            throw new Error(
                "AI did not return personality analysis"
            );
        }

        let personality;

        try {
            personality =
                JSON.parse(
                    text
                        .replace(
                            /```json/gi,
                            ""
                        )
                        .replace(
                            /```/g,
                            ""
                        )
                        .trim()
                );

        } catch {
            throw new Error(
                "Invalid personality response from AI"
            );
        }

        return res.status(200).json({
            success: true,
            personality
        });

    } catch (error) {
        console.error(
            "AI PERSONALITY ERROR:",
            error
        );

        const status =
            Number(
                error?.status ||
                error?.statusCode ||
                error?.response?.status
            );

        if (
            status === 429 ||
            status === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "AI is temporarily busy. Please try again shortly."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to generate AI personality"
        });
    }
};


// =====================================================
// AI FUTURE PREDICTION
// =====================================================

export const generateAIPrediction = async (
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

        if (
            !process.env.GEMINI_API_KEY
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Gemini API key is not configured"
            });
        }

        const posts =
            await Post.find({
                user: userId
            })
                .sort({
                    createdAt: -1
                })
                .limit(30)
                .lean();

        if (!posts.length) {
            return res.status(200).json({
                success: true,

                prediction: {
                    score: 0,

                    trend:
                        "Start creating",

                    bestContent:
                        "Your future content trend will appear after you create posts.",

                    prediction:
                        "Create at least a few posts so PingUp AI can learn your content pattern.",

                    tips: [
                        "Post consistently",
                        "Try image-based content",
                        "Use engaging captions"
                    ]
                }
            });
        }

        const postData =
            posts.map(
                (post, index) => ({
                    postNumber:
                        index + 1,

                    content:
                        post.content ||
                        "",

                    postType:
                        post.post_type ||
                        "text",

                    images:
                        Array.isArray(
                            post.image_urls
                        )
                            ? post.image_urls.length
                            : 0,

                    likes:
                        Array.isArray(
                            post.likes_count
                        )
                            ? post.likes_count.length
                            : 0,

                    comments:
                        Number(
                            post.comments_count ||
                            0
                        ),

                    shares:
                        Number(
                            post.share_count ||
                            0
                        ),

                    createdAt:
                        post.createdAt
                })
            );

        const prompt = `
You are PingUp AI Future Content Predictor.

Analyze the user's recent posts and engagement.

POST DATA:
${JSON.stringify(
    postData,
    null,
    2
)}

Predict what kind of content is likely to perform best for this user based on their own historical activity.

Return ONLY valid JSON in exactly this format:

{
    "score": 85,
    "trend": "Growing",
    "bestContent": "short description of content type likely to perform well",
    "prediction": "2 sentence prediction about the user's future content performance",
    "tips": [
        "tip 1",
        "tip 2",
        "tip 3"
    ]
}

Rules:
- Score must be between 0 and 100.
- Do not claim certainty.
- This is a prediction, not a guarantee.
- Base the prediction on the supplied engagement data.
- Keep it useful for a social media user.
- Do not make sensitive personal assumptions.
- Do not include markdown.
`;

        const response =
            await generateWithRetry(
                () =>
                    ai.models.generateContent({
                        model:
                            GEMINI_MODEL,

                        contents:
                            prompt,

                        config: {
                            responseMimeType:
                                "application/json",

                            thinkingConfig: {
                                thinkingLevel:
                                    "low"
                            }
                        }
                    })
            );

        const text =
            getGeminiText(
                response
            );

        if (!text) {
            throw new Error(
                "AI did not return prediction"
            );
        }

        let prediction;

        try {
            prediction =
                JSON.parse(
                    text
                        .replace(
                            /```json/gi,
                            ""
                        )
                        .replace(
                            /```/g,
                            ""
                        )
                        .trim()
                );

        } catch {
            throw new Error(
                "Invalid prediction response from AI"
            );
        }

        prediction.score =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        prediction.score ||
                        0
                    )
                )
            );

        return res.status(200).json({
            success: true,
            prediction
        });

    } catch (error) {
        console.error(
            "AI PREDICTION ERROR:",
            error
        );

        const status =
            Number(
                error?.status ||
                error?.statusCode ||
                error?.response?.status
            );

        if (
            status === 429 ||
            status === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "AI is temporarily busy. Please try again shortly."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to generate AI prediction"
        });
    }
};


// =====================================================
// AI CHATBOT - PINGUP AI COMPANION
// =====================================================

export const generateAIChat = async (
    req,
    res
) => {
    console.log(
        "========== AI CHAT CONTROLLER CALLED =========="
    );

    try {
        const userId =
            req.authUserId ||
            req.auth?.userId;

        console.log(
            "AI CHAT USER ID:",
            userId
        );

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "User not authenticated"
            });
        }

        if (
            !process.env.GEMINI_API_KEY
        ) {
            console.error(
                "GEMINI_API_KEY IS MISSING"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gemini API key is not configured"
            });
        }

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message:
                    "Request body is missing"
            });
        }

        const message =
            typeof req.body.message ===
            "string"
                ? req.body.message.trim()
                : "";

        const history =
            Array.isArray(
                req.body.history
            )
                ? req.body.history
                : [];

        console.log(
            "AI CHAT MESSAGE:",
            message
        );

        if (!message) {
            return res.status(400).json({
                success: false,
                message:
                    "Message is required"
            });
        }

        const posts =
            await Post.find({
                user: userId
            })
                .sort({
                    createdAt: -1
                })
                .limit(8)
                .lean();

        const postData =
            posts.map(
                (post, index) => ({
                    postNumber:
                        index + 1,

                    content:
                        post.content ||
                        "",

                    postType:
                        post.post_type ||
                        "text",

                    images:
                        Array.isArray(
                            post.image_urls
                        )
                            ? post.image_urls.length
                            : 0,

                    likes:
                        Array.isArray(
                            post.likes_count
                        )
                            ? post.likes_count.length
                            : 0,

                    comments:
                        Number(
                            post.comments_count ||
                            0
                        ),

                    shares:
                        Number(
                            post.share_count ||
                            0
                        ),

                    createdAt:
                        post.createdAt
                })
            );

        const recentHistory =
            history
                .filter(
                    item =>
                        item &&
                        typeof item.content ===
                            "string" &&
                        (
                            item.role ===
                                "user" ||
                            item.role ===
                                "assistant"
                        )
                )
                .slice(-6);

        const conversationText =
            recentHistory.length > 0
                ? recentHistory
                    .map(
                        item =>
                            `${
                                item.role ===
                                "user"
                                    ? "User"
                                    : "PingUp AI"
                            }: ${
                                item.content
                            }`
                    )
                    .join("\n")
                : "No previous conversation.";

        const prompt = `
You are "PingUp AI Companion", the built-in AI assistant of the PingUp social media platform.

You are friendly, intelligent, creative and conversational.

Your main purpose is to help users understand and improve their social media activity.

USER'S RECENT PINGUP POSTS:
${JSON.stringify(
    postData,
    null,
    2
)}

RECENT CONVERSATION:
${conversationText}

CURRENT USER MESSAGE:
${message}

You can help with:

1. POST IDEAS
Give creative post ideas based on the user's recent content.

2. POST IMPROVEMENT
Improve captions, posts, hooks and descriptions.

3. PROFILE GROWTH
Give practical suggestions for improving social engagement.

4. CONTENT ANALYSIS
Explain patterns in their posts, engagement and posting style.

5. PERSONALITY
Discuss social-media personality patterns without making psychological diagnoses.

6. FUTURE CONTENT
Discuss possible future content trends, but never claim predictions are guaranteed.

7. CREATIVE MODE
Generate captions, hooks, reel ideas, content themes and hashtag suggestions.

8. NORMAL CHAT
Answer normal questions naturally.

IMPORTANT RULES:
- Do not diagnose mental health.
- Do not make sensitive personal assumptions.
- Do not claim predictions are guaranteed.
- Do not reveal private database information.
- Do not mention internal APIs, controllers or server code.
- Use the user's PingUp activity only for useful social-media-related suggestions.
- Be encouraging and practical.
- Use emojis when they improve the response.
- Do not return JSON.
- Do not use markdown tables.
- Keep most responses concise but useful.
- Respond directly to the user's current message.
`;

        console.log(
            "SENDING REQUEST TO GEMINI..."
        );

        const response =
            await generateWithRetry(
                () =>
                    ai.models.generateContent({
                        model:
                            GEMINI_MODEL,

                        contents:
                            prompt,

                        config: {
                            thinkingConfig: {
                                thinkingLevel:
                                    "low"
                            }
                        }
                    })
            );

        console.log(
            "GEMINI RESPONSE RECEIVED"
        );

        const reply =
            getGeminiText(
                response
            );

        console.log(
            "AI CHAT REPLY:",
            reply
        );

        if (!reply) {
            throw new Error(
                "AI did not return a response"
            );
        }

        return res.status(200).json({
            success: true,
            reply
        });

    } catch (error) {
        console.error(
            "========== AI CHAT ERROR =========="
        );

        console.error(
            "Error message:",
            error?.message
        );

        console.error(
            "Error status:",
            error?.status
        );

        console.error(
            "Error statusCode:",
            error?.statusCode
        );

        console.error(
            "Full error:",
            error
        );

        const status =
            Number(
                error?.status ||
                error?.statusCode ||
                error?.response?.status
            );

        if (status === 429) {
            return res.status(503).json({
                success: false,
                message:
                    "PingUp AI is handling many requests right now. Please try again shortly."
            });
        }

        if (status === 503) {
            return res.status(503).json({
                success: false,
                message:
                    "PingUp AI is temporarily unavailable. Please try again shortly."
            });
        }

        if (status === 404) {
            return res.status(404).json({
                success: false,
                message:
                    `Gemini model "${GEMINI_MODEL}" is unavailable.`
            });
        }

        if (
            status === 401 ||
            status === 403
        ) {
            return res.status(status).json({
                success: false,
                message:
                    "Gemini API authentication failed. Please check your GEMINI_API_KEY."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to generate AI response"
        });
    }
};


// =====================================================
// AI PROFILE INSIGHTS
// =====================================================

export const generateAIInsights = async (
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

        if (
            !process.env.GEMINI_API_KEY
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Gemini API key is not configured"
            });
        }

        const posts =
            await Post.find({
                user: userId
            })
                .sort({
                    createdAt: -1
                })
                .limit(20)
                .lean();

        if (!posts.length) {
            return res.status(200).json({
                success: true,

                insights: {
                    activity:
                        "No activity yet",

                    contentStyle:
                        "Create your first post",

                    mood:
                        "Waiting to be discovered ✨",

                    themes: [
                        "Start posting",
                        "Share your interests",
                        "Try different content"
                    ],

                    recommendation:
                        "Create a few posts so PingUp AI can understand your content style.",

                    bestContent:
                        "Your best content type will appear after you create more posts."
                }
            });
        }

        const postData =
            posts.map(
                (post, index) => ({
                    postNumber:
                        index + 1,

                    content:
                        post.content ||
                        "",

                    postType:
                        post.post_type ||
                        "text",

                    imageCount:
                        Array.isArray(
                            post.image_urls
                        )
                            ? post.image_urls.length
                            : 0,

                    commentCount:
                        Number(
                            post.comments_count ||
                            0
                        ),

                    shareCount:
                        Number(
                            post.share_count ||
                            0
                        ),

                    createdAt:
                        post.createdAt
                })
            );

        const prompt = `
You are PingUp AI Profile Insights.

Analyze the user's recent PingUp posts and create useful social-media insights.

USER POST DATA:
${JSON.stringify(
    postData,
    null,
    2
)}

Return ONLY valid JSON in exactly this format:

{
    "activity": "short description of how active the user is",
    "contentStyle": "short description of the user's content style",
    "mood": "overall mood or vibe of the user's content",
    "themes": [
        "theme 1",
        "theme 2",
        "theme 3"
    ],
    "recommendation": "one useful personalized recommendation",
    "bestContent": "the type of content this user appears best suited to create"
}

Rules:
- Analyze ONLY the supplied social media activity.
- Do not diagnose personality or mental health.
- Do not make sensitive personal assumptions.
- Keep the insights positive and useful.
- Do not mention likes.
- Do not invent information that is not supported by the posts.
- Keep each field concise.
- Return exactly 3 themes.
- Do not use markdown.
`;

        const response =
            await generateWithRetry(
                () =>
                    ai.models.generateContent({
                        model:
                            GEMINI_MODEL,

                        contents:
                            prompt,

                        config: {
                            responseMimeType:
                                "application/json",

                            thinkingConfig: {
                                thinkingLevel:
                                    "low"
                            }
                        }
                    })
            );

        const text =
            getGeminiText(
                response
            );

        if (!text) {
            throw new Error(
                "AI did not return profile insights"
            );
        }

        let insights;

        try {
            insights =
                JSON.parse(
                    text
                        .replace(
                            /```json/gi,
                            ""
                        )
                        .replace(
                            /```/g,
                            ""
                        )
                        .trim()
                );

        } catch {
            throw new Error(
                "Invalid AI insights response"
            );
        }

        if (
            !Array.isArray(
                insights.themes
            )
        ) {
            insights.themes = [];
        }

        insights.themes =
            insights.themes
                .filter(
                    theme =>
                        typeof theme ===
                            "string" &&
                        theme.trim()
                )
                .slice(0, 3);

        return res.status(200).json({
            success: true,
            insights
        });

    } catch (error) {
        console.error(
            "AI PROFILE INSIGHTS ERROR:",
            error
        );

        const status =
            Number(
                error?.status ||
                error?.statusCode ||
                error?.response?.status
            );

        if (
            status === 429 ||
            status === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "AI is temporarily busy. Please try again shortly."
            });
        }

        if (status === 404) {
            return res.status(404).json({
                success: false,
                message:
                    `Gemini model "${GEMINI_MODEL}" is unavailable.`
            });
        }

        if (
            status === 401 ||
            status === 403
        ) {
            return res.status(status).json({
                success: false,
                message:
                    "Gemini API authentication failed. Please check your GEMINI_API_KEY."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to generate AI profile insights"
        });
    }
};


// =====================================================
// GEMINI RESPONSE TEXT HELPER
// =====================================================

const getGeminiText = (
    response
) => {
    try {
        if (
            response &&
            typeof response.text ===
                "string"
        ) {
            return response.text.trim();
        }

        if (
            response &&
            typeof response.text ===
                "function"
        ) {
            const text =
                response.text();

            if (
                typeof text ===
                "string"
            ) {
                return text.trim();
            }
        }

        if (
            response?.candidates?.length
        ) {
            const parts =
                response
                    .candidates[0]
                    ?.content
                    ?.parts || [];

            const text =
                parts
                    .map(
                        part =>
                            part?.text ||
                            ""
                    )
                    .join("")
                    .trim();

            if (text) {
                return text;
            }
        }

        return "";

    } catch (error) {
        console.error(
            "GEMINI TEXT EXTRACTION ERROR:",
            error
        );

        return "";
    }
};


// =====================================================
// GEMINI RETRY HELPER
// =====================================================

const generateWithRetry = async (
    generateFunction
) => {
    let lastError = null;

    const maxAttempts = 10;

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {
        try {
            console.log(
                `GEMINI REQUEST ATTEMPT ${attempt}/${maxAttempts}`
            );

            const response =
                await generateFunction();

            console.log(
                "GEMINI REQUEST SUCCESS"
            );

            return response;

        } catch (error) {
            lastError = error;

            const status =
                Number(
                    error?.status ||
                    error?.statusCode ||
                    error?.response?.status
                );

            console.error(
                `GEMINI REQUEST FAILED - ATTEMPT ${attempt}`
            );

            console.error(
                "STATUS:",
                status
            );

            console.error(
                "ERROR:",
                error?.message
            );

            if (
                status !== 429 &&
                status !== 503 &&
                status !== 500
            ) {
                throw error;
            }

            if (
                attempt >=
                maxAttempts
            ) {
                console.error(
                    "GEMINI MAX RETRIES REACHED"
                );

                break;
            }

            const exponentialDelay =
                Math.min(
                    30000,
                    3000 *
                    Math.pow(
                        2,
                        attempt - 1
                    )
                );

            const randomDelay =
                Math.floor(
                    Math.random() *
                    2000
                );

            const retryDelay =
                exponentialDelay +
                randomDelay;

            console.log(
                `GEMINI TEMPORARY ERROR. RETRYING IN ${Math.ceil(
                    retryDelay / 1000
                )} SECONDS...`
            );

            await sleep(
                retryDelay
            );
        }
    }

    throw (
        lastError ||
        new Error(
            "Gemini request failed after multiple attempts"
        )
    );
};


// =====================================================
// SLEEP
// =====================================================

const sleep = (
    milliseconds
) =>
    new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );


// =====================================================
// GET FEED POSTS
// =====================================================

export const getFeedPosts = async (
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

        const now =
            new Date();

        const posts =
            await Post.find({
                publishAt: {
                    $lte: now
                }
            })
                .sort({
                    createdAt: -1
                })
                .lean();

        const userIds = [
            ...new Set(
                posts.map(
                    post =>
                        post.user
                )
            )
        ];

        const users =
            await User.find({
                _id: {
                    $in: userIds
                }
            })
                .select(
                    "_id full_name username profile_picture"
                )
                .lean();

        const userMap = {};

        users.forEach(
            user => {
                userMap[
                    user._id.toString()
                ] = user;
            }
        );

        // =================================================
        // FORMAT POSTS + REACTIONS
        // =================================================

        const formattedPosts =
            posts.map(
                post => {

                    const reactionCounts = {
                        love: 0,
                        haha: 0,
                        wow: 0,
                        sad: 0,
                        angry: 0
                    };

                    let userReaction =
                        null;

                    if (
                        Array.isArray(
                            post.reactions
                        )
                    ) {
                        post.reactions.forEach(
                            reaction => {

                                if (
                                    reactionCounts[
                                        reaction.type
                                    ] !== undefined
                                ) {
                                    reactionCounts[
                                        reaction.type
                                    ]++;
                                }

                                if (
                                    String(
                                        reaction.user
                                    ) ===
                                    String(
                                        userId
                                    )
                                ) {
                                    userReaction =
                                        reaction.type;
                                }
                            }
                        );
                    }

                    return {
                        ...post,

                        user:
                            userMap[
                                post.user
                                    ?.toString()
                            ] || null,

                        likes_count:
                            Array.isArray(
                                post.likes_count
                            )
                                ? post.likes_count.length
                                : 0,

                        isLiked:
                            Array.isArray(
                                post.likes_count
                            )
                                ? post.likes_count.some(
                                    id =>
                                        id.toString() ===
                                        userId.toString()
                                )
                                : false,

                        // NEW REACTION DATA
                        reactionCounts,

                        userReaction,

                        totalReactions:
                            Array.isArray(
                                post.reactions
                            )
                                ? post.reactions.length
                                : 0,

                        share_count:
                            typeof post.share_count ===
                            "number"
                                ? post.share_count
                                : 0
                    };
                }
            );

        return res.status(200).json({
            success: true,

            posts:
                formattedPosts
        });

    } catch (error) {
        console.error(
            "GET FEED ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
};


// =====================================================
// LIKE POST
// =====================================================

export const likePost = async (
    req,
    res
) => {
    try {
        const userId =
            req.authUserId ||
            req.auth?.userId;

        const {
            postId
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "User not authenticated"
            });
        }

        if (!postId) {
            return res.status(400).json({
                success: false,
                message:
                    "Post ID is required"
            });
        }

        const post =
            await Post.findById(
                postId
            );

        if (!post) {
            return res.status(404).json({
                success: false,
                message:
                    "Post not found"
            });
        }

        if (
            !Array.isArray(
                post.likes_count
            )
        ) {
            post.likes_count = [];
        }

        const index =
            post.likes_count.findIndex(
                id =>
                    id.toString() ===
                    userId.toString()
            );

        let liked;

        if (index === -1) {
            post.likes_count.push(
                userId
            );

            liked = true;

        } else {
            post.likes_count.splice(
                index,
                1
            );

            liked = false;
        }

        await post.save();

        return res.status(200).json({
            success: true,

            liked,

            likes_count:
                post.likes_count.length
        });

    } catch (error) {
        console.error(
            "LIKE POST ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
};


// =====================================================
// REACT TO POST
// =====================================================

export const reactToPost = async (
    req,
    res
) => {
    try {
        const userId =
            req.authUserId ||
            req.auth?.userId;

        const {
            postId,
            reaction
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "User not authenticated"
            });
        }

        if (!postId) {
            return res.status(400).json({
                success: false,
                message:
                    "Post ID is required"
            });
        }

        const validReactions = [
            "love",
            "haha",
            "wow",
            "sad",
            "angry"
        ];

        if (
            !validReactions.includes(
                reaction
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid reaction"
            });
        }

        const post =
            await Post.findById(
                postId
            );

        if (!post) {
            return res.status(404).json({
                success: false,
                message:
                    "Post not found"
            });
        }

        if (
            !Array.isArray(
                post.reactions
            )
        ) {
            post.reactions = [];
        }

        const existingIndex =
            post.reactions.findIndex(
                item =>
                    String(
                        item.user
                    ) ===
                    String(userId)
            );

        let userReaction =
            null;

        // USER ALREADY HAS A REACTION
        if (
            existingIndex !== -1
        ) {

            const existingReaction =
                post.reactions[
                    existingIndex
                ].type;

            // SAME REACTION = REMOVE
            if (
                existingReaction ===
                reaction
            ) {

                post.reactions.splice(
                    existingIndex,
                    1
                );

                userReaction =
                    null;

            } else {

                // DIFFERENT REACTION = CHANGE
                post.reactions[
                    existingIndex
                ].type =
                    reaction;

                userReaction =
                    reaction;
            }

        } else {

            // NEW REACTION
            post.reactions.push({
                user: userId,
                type: reaction
            });

            userReaction =
                reaction;
        }

        await post.save();

        // =================================================
        // COUNT EACH REACTION
        // =================================================

        const reactionCounts = {
            love: 0,
            haha: 0,
            wow: 0,
            sad: 0,
            angry: 0
        };

        post.reactions.forEach(
            item => {

                if (
                    reactionCounts[
                        item.type
                    ] !== undefined
                ) {
                    reactionCounts[
                        item.type
                    ]++;
                }
            }
        );

        return res.status(200).json({
            success: true,

            userReaction,

            reactionCounts,

            totalReactions:
                post.reactions.length
        });

    } catch (error) {
        console.error(
            "REACT TO POST ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                error.message ||
                "Failed to react to post"
        });
    }
};


// =====================================================
// GET LIKED PEOPLE
// =====================================================

export const getLikedPeople = async (
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

        const likedPosts =
            await Post.find({
                likes_count:
                    userId
            })
                .select("user")
                .lean();

        const userIds = [
            ...new Set(
                likedPosts
                    .map(
                        post =>
                            post.user
                                ?.toString()
                    )
                    .filter(Boolean)
            )
        ];

        if (
            !userIds.length
        ) {
            return res.status(200).json({
                success: true,
                users: []
            });
        }

        const users =
            await User.find({
                _id: {
                    $in: userIds
                }
            })
                .select(
                    "_id full_name username profile_picture"
                )
                .lean();

        return res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        console.error(
            "GET LIKED PEOPLE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
};


// =====================================================
// ADD COMMENT
// =====================================================

export const addComment = async (
    req,
    res
) => {
    try {
        const userId =
            req.authUserId ||
            req.auth?.userId;

        const {
            postId,
            text
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "User not authenticated"
            });
        }

        if (
            !postId ||
            !text ||
            !text.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Post ID and comment text are required"
            });
        }

        const post =
            await Post.findById(
                postId
            );

        if (!post) {
            return res.status(404).json({
                success: false,
                message:
                    "Post not found"
            });
        }

        const comment =
            await Comment.create({
                post: postId,
                user: userId,
                text:
                    text.trim()
            });

        post.comments_count =
            (post.comments_count || 0) +
            1;

        await post.save();

        return res.status(201).json({
            success: true,
            comment
        });

    } catch (error) {
        console.error(
            "ADD COMMENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
};


// =====================================================
// GET COMMENTS
// =====================================================

export const getComments = async (
    req,
    res
) => {
    try {
        const {
            postId
        } = req.params;

        if (!postId) {
            return res.status(400).json({
                success: false,
                message:
                    "Post ID is required"
            });
        }

        const comments =
            await Comment.find({
                post: postId
            })
                .sort({
                    createdAt: -1
                })
                .lean();

        const userIds = [
            ...new Set(
                comments.map(
                    comment =>
                        comment.user
                            ?.toString()
                )
            )
        ];

        const users =
            await User.find({
                _id: {
                    $in: userIds
                }
            })
                .select(
                    "_id full_name username profile_picture"
                )
                .lean();

        const userMap = {};

        users.forEach(
            user => {
                userMap[
                    user._id.toString()
                ] = user;
            }
        );

        const formattedComments =
            comments.map(
                comment => ({
                    ...comment,

                    user:
                        userMap[
                            comment.user
                                ?.toString()
                        ] || null
                })
            );

        return res.status(200).json({
            success: true,

            comments:
                formattedComments
        });

    } catch (error) {
        console.error(
            "GET COMMENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
};


// =====================================================
// SHARE POST
// =====================================================

export const sharePost = async (
    req,
    res
) => {
    try {
        const userId =
            req.authUserId ||
            req.auth?.userId;

        const {
            postId
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "User not authenticated"
            });
        }

        if (!postId) {
            return res.status(400).json({
                success: false,
                message:
                    "Post ID is required"
            });
        }

        const post =
            await Post.findById(
                postId
            );

        if (!post) {
            return res.status(404).json({
                success: false,
                message:
                    "Post not found"
            });
        }

        post.share_count =
            (post.share_count || 0) +
            1;

        await post.save();

        return res.status(200).json({
            success: true,

            message:
                "Post shared successfully",

            share_count:
                post.share_count
        });

    } catch (error) {
        console.error(
            "SHARE POST ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
};


// =====================================================
// DELETE POST
// =====================================================

export const deletePost = async (
    req,
    res
) => {
    try {
        const userId =
            req.authUserId ||
            req.auth?.userId;

        const {
            postId
        } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "User not authenticated"
            });
        }

        if (!postId) {
            return res.status(400).json({
                success: false,
                message:
                    "Post ID is required"
            });
        }

        const post =
            await Post.findById(
                postId
            );

        if (!post) {
            return res.status(404).json({
                success: false,
                message:
                    "Post not found"
            });
        }

        if (
            post.user.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can delete only your own post"
            });
        }

        await Post.findByIdAndDelete(
            postId
        );

        await Comment.deleteMany({
            post: postId
        });

        return res.status(200).json({
            success: true,

            message:
                "Post deleted successfully"
        });

    } catch (error) {
        console.error(
            "DELETE POST ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
};