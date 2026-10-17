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

const GEMINI_QUOTA_MESSAGE =
    "Gemini API quota has been exceeded. Please check your Gemini API quota or billing plan and try again later.";


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
                captions = JSON.parse(
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
        console.log(
            "========== AI CAPTION REQUEST =========="
        );

        const userId =
            req.authUserId ||
            req.auth?.userId;

        console.log(
            "AI CAPTION USER:",
            userId
        );

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

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message:
                    "Gemini API key is not configured"
            });
        }

        const file = req.file;

        console.log(
            "AI MEDIA:",
            {
                name:
                    file.originalname,

                type:
                    file.mimetype,

                size:
                    `${(
                        file.size /
                        1024 /
                        1024
                    ).toFixed(2)} MB`
            }
        );

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

        const isVideo =
            file.mimetype.startsWith(
                "video/"
            );


        // =================================================
        // VIDEO SIZE LIMIT
        // =================================================

        if (
            isVideo &&
            file.size >
                20 * 1024 * 1024
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Video must be smaller than 20MB for AI captions"
            });
        }


        // =================================================
        // IMAGE SIZE LIMIT
        // =================================================

        if (
            !isVideo &&
            file.size >
                10 * 1024 * 1024
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Image must be smaller than 10MB for AI captions"
            });
        }


        // =================================================
        // AI PROMPT
        // =================================================

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


        // =================================================
        // IMAGE AI CAPTION
        // =================================================

        if (!isVideo) {

            console.log(
                "AI CAPTION: processing image..."
            );

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

                                responseSchema: {
                                    type:
                                        "array",

                                    minItems:
                                        5,

                                    maxItems:
                                        5,

                                    items: {
                                        type:
                                            "string"
                                    }
                                },

                                thinkingConfig: {
                                    thinkingLevel:
                                        "low"
                                }
                            }
                        })
                );

            console.log(
                "AI CAPTION: image response received"
            );

        } else {


            // =================================================
            // VIDEO AI CAPTION
            // =================================================

            console.log(
                "AI CAPTION: preparing video..."
            );

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

            console.log(
                "AI CAPTION: uploading video to Gemini..."
            );

            let videoFile =
                await withTimeout(
                    ai.files.upload({
                        file:
                            temporaryFilePath,

                        config: {
                            mimeType:
                                file.mimetype
                        }
                    }),

                    30000,

                    "Video upload to Gemini timed out"
                );

            console.log(
                "AI CAPTION: video uploaded:",
                videoFile?.name
            );


            // =================================================
            // WAIT FOR VIDEO PROCESSING
            // Maximum 30 seconds
            // =================================================

            const processingStart =
                Date.now();

            const maximumProcessingTime =
                30000;

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

                console.log(
                    "AI VIDEO STATE:",
                    currentState
                );

                if (
                    currentState ===
                    "FAILED"
                ) {
                    throw new Error(
                        "Gemini failed to process the video"
                    );
                }

                if (
                    Date.now() -
                        processingStart >
                    maximumProcessingTime
                ) {
                    throw new Error(
                        "Video processing is taking too long. Please try a shorter video."
                    );
                }

                await sleep(
                    2000
                );

                videoFile =
                    await withTimeout(
                        ai.files.get({
                            name:
                                videoFile.name
                        }),

                        8000,

                        "Checking video processing timed out"
                    );
            }

            console.log(
                "AI CAPTION: video is ACTIVE"
            );


            // =================================================
            // GENERATE VIDEO CAPTIONS
            // =================================================

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

                                responseSchema: {
                                    type:
                                        "array",

                                    minItems:
                                        5,

                                    maxItems:
                                        5,

                                    items: {
                                        type:
                                            "string"
                                    }
                                },

                                thinkingConfig: {
                                    thinkingLevel:
                                        "low"
                                }
                            }
                        })
                );

            console.log(
                "AI CAPTION: video response received"
            );
        }


        // =================================================
        // EXTRACT GEMINI RESPONSE
        // =================================================

        const text =
            getGeminiText(
                response
            );

        console.log(
            "AI CAPTION RAW RESPONSE:",
            text
        );

        if (!text) {
            throw new Error(
                "AI did not return any captions"
            );
        }


        // =================================================
        // PARSE CAPTIONS
        // =================================================

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


        if (
            captions.length < 5
        ) {
            console.warn(
                `AI returned only ${captions.length} captions`
            );
        }


        console.log(
            "AI CAPTION SUCCESS:",
            captions
        );

        return res.status(200).json({
            success: true,
            captions
        });

    } catch (error) {

        console.error(
            "========== AI CAPTION ERROR =========="
        );

        console.error(
            "Message:",
            error?.message
        );

        console.error(
            "Status:",
            error?.status
        );

        console.error(
            "Status Code:",
            error?.statusCode
        );

        console.error(
            "Full Error:",
            error
        );

        const status =
            Number(
                error?.status ||
                error?.statusCode ||
                error?.response?.status ||
                0
            );


        // =================================================
        // GEMINI QUOTA EXCEEDED
        // =================================================

        if (
            status === 429
        ) {
            return res.status(429).json({
                success: false,
                message:
                    GEMINI_QUOTA_MESSAGE
            });
        }


        // =================================================
        // GEMINI TEMPORARILY UNAVAILABLE
        // =================================================

        if (
            status === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "Gemini AI is temporarily unavailable. Please try again shortly."
            });
        }


        // =================================================
        // MODEL NOT FOUND
        // =================================================

        if (
            status === 404
        ) {
            return res.status(404).json({
                success: false,
                message:
                    `Gemini model "${GEMINI_MODEL}" is unavailable.`
            });
        }


        // =================================================
        // AUTHENTICATION ERROR
        // =================================================

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


        // =================================================
        // TIMEOUT
        // =================================================

        if (
            status === 408 ||
            error?.message
                ?.toLowerCase()
                .includes("timed out")
        ) {
            return res.status(408).json({
                success: false,
                message:
                    error.message
            });
        }


        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to generate AI captions"
        });

    } finally {

        if (
            temporaryFilePath
        ) {
            try {
                await fs.unlink(
                    temporaryFilePath
                );

                console.log(
                    "Temporary AI video file deleted"
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
                error?.response?.status ||
                0
            );

        if (
            status === 429
        ) {
            return res.status(429).json({
                success: false,
                message:
                    GEMINI_QUOTA_MESSAGE
            });
        }

        if (
            status === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "Gemini AI is temporarily unavailable. Please try again shortly."
            });
        }

        if (
            status === 404
        ) {
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
                error?.response?.status ||
                0
            );

        if (
            status === 429
        ) {
            return res.status(429).json({
                success: false,
                message:
                    GEMINI_QUOTA_MESSAGE
            });
        }

        if (
            status === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "Gemini AI is temporarily unavailable. Please try again shortly."
            });
        }

        if (
            status === 404
        ) {
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
                error?.response?.status ||
                0
            );

        if (
            status === 429
        ) {
            return res.status(429).json({
                success: false,
                message:
                    GEMINI_QUOTA_MESSAGE
            });
        }

        if (
            status === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "PingUp AI is temporarily unavailable. Please try again shortly."
            });
        }

        if (
            status === 404
        ) {
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

        if (
            status === 408 ||
            error?.message
                ?.toLowerCase()
                .includes("timed out")
        ) {
            return res.status(408).json({
                success: false,
                message:
                    error.message
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
                error?.response?.status ||
                0
            );

        if (
            status === 429
        ) {
            return res.status(429).json({
                success: false,
                message:
                    GEMINI_QUOTA_MESSAGE
            });
        }

        if (
            status === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "Gemini AI is temporarily unavailable. Please try again shortly."
            });
        }

        if (
            status === 404
        ) {
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

    // =================================================
    // ONLY 2 ATTEMPTS
    // =================================================

    const maxAttempts = 2;

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
                await withTimeout(
                    generateFunction(),
                    30000,
                    "Gemini AI request timed out. Please try again."
                );

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
                    error?.response?.status ||
                    0
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


            // =================================================
            // IMPORTANT
            // 429 = QUOTA EXCEEDED
            //
            // Do NOT wait and retry quota errors.
            // =================================================

            if (
                status === 429
            ) {
                console.error(
                    "GEMINI QUOTA EXCEEDED - STOPPING WITHOUT RETRY"
                );

                throw error;
            }


            // =================================================
            // DO NOT RETRY AUTH / INVALID REQUEST / MODEL
            // =================================================

            if (
                status === 400 ||
                status === 401 ||
                status === 403 ||
                status === 404
            ) {
                throw error;
            }


            // =================================================
            // ONLY RETRY TEMPORARY SERVER ERRORS
            // =================================================

            const temporaryError =
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504 ||
                status === 408 ||
                error?.message
                    ?.toLowerCase()
                    .includes("timed out");


            if (
                !temporaryError
            ) {
                throw error;
            }


            if (
                attempt >=
                maxAttempts
            ) {
                break;
            }


            console.log(
                "Retrying Gemini request in 1.5 seconds..."
            );

            await sleep(
                1500
            );
        }
    }

    throw (
        lastError ||
        new Error(
            "Gemini AI request failed"
        )
    );
};


// =====================================================
// TIMEOUT HELPER
// =====================================================

const withTimeout = (
    promise,
    milliseconds,
    message
) => {

    let timeoutId;

    const timeoutPromise =
        new Promise(
            (_, reject) => {

                timeoutId =
                    setTimeout(
                        () => {

                            const error =
                                new Error(
                                    message
                                );

                            error.status =
                                408;

                            reject(
                                error
                            );

                        },
                        milliseconds
                    );
            }
        );

    return Promise.race([
        promise,
        timeoutPromise
    ]).finally(
        () => {
            clearTimeout(
                timeoutId
            );
        }
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

        if (
            index === -1
        ) {

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
                    String(
                        userId
                    )
            );

        let userReaction =
            null;

        if (
            existingIndex !== -1
        ) {

            const existingReaction =
                post.reactions[
                    existingIndex
                ].type;

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

                post.reactions[
                    existingIndex
                ].type =
                    reaction;

                userReaction =
                    reaction;
            }

        } else {

            post.reactions.push({
                user: userId,
                type: reaction
            });

            userReaction =
                reaction;
        }

        await post.save();

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