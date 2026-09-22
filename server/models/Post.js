import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
    {
        user: {
            type: String,
            ref: 'User',
            required: true
        },

        content: {
            type: String
        },

        image_urls: [
            {
                url: {
                    type: String,
                    required: true
                },
                caption: {
                    type: String,
                    default: ''
                }
            }
        ],

        post_type: {
            type: String,
            enum: [
                'text',
                'image',
                'text_with_image'
            ],
            required: true
        },

        // ==========================================
        // OLD LIKE SYSTEM - KEPT FOR COMPATIBILITY
        // ==========================================

        likes_count: [
            {
                type: String,
                ref: 'User'
            }
        ],

        // ==========================================
        // NEW REACTION SYSTEM
        // ==========================================

        reactions: [
            {
                user: {
                    type: String,
                    ref: 'User',
                    required: true
                },

                type: {
                    type: String,
                    enum: [
                        'love',
                        'haha',
                        'wow',
                        'sad',
                        'angry'
                    ],
                    required: true
                }
            }
        ],

        comments_count: {
            type: Number,
            default: 0
        },

        share_count: {
            type: Number,
            default: 0
        },

        publishAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true,
        minimize: false
    }
);

const Post = mongoose.model(
    'Post',
    postSchema
);

export default Post;