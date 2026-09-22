import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    full_name: {
      type: String,
      required: true
    },

    username: {
      type: String,
      unique: true,
      sparse: true
    },

    bio: {
      type: String,
      default: 'Hey there! I am using PingUp.'
    },

    profile_picture: {
      type: String,
      default: ''
    },

    cover_photo: {
      type: String,
      default: ''
    },

    location: {
      type: String,
      default: ''
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    // Users who follow this user
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Users this user follows
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Users who are connected with this user
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Users who have sent connection requests
    // and are waiting for this user to accept
    pendingConnections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Users whose posts/content this user liked
    liked_people: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true,
    minimize: false
  }
)

const User = mongoose.model('User', userSchema)

export default User