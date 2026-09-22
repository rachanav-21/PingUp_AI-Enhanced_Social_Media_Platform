import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register User
export const registerUser = async (req, res) => {
    try {
        const { email, password, full_name, username } = req.body;

        // Check required fields
        if (!email || !password || !full_name || !username) {
            return res.status(400).json({
                success: false,
                message: "Email, username, password and full name are required"
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username });

        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: "Username already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword,
            full_name,
            username
        });

        // Create JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Login User - Username + Password
export const loginUser = async (req, res) => {
    try {

        const { username, password } = req.body;

        // Temporary debug
        console.log("LOGIN REQUEST USERNAME:", username);

        // Check required fields
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const cleanUsername = username.trim();

        // Find user by username
        const user = await User.findOne({
            username: cleanUsername
        });

        // Temporary debug
        console.log(
            "USER FOUND:",
            user ? user.username : "NO USER FOUND"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        // Temporary debug
        console.log("PASSWORD MATCH:", isMatch);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Send response
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                profile_picture: user.profile_picture,
                cover_photo: user.cover_photo,
                bio: user.bio,
                location: user.location
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};