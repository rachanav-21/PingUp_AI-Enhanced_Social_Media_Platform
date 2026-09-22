import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
    try {
        console.log("PROTECT MIDDLEWARE CALLED");

        const authHeader = req.headers.authorization;

        console.log("Authorization header:", authHeader);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated. Token missing."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token missing."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("Decoded JWT:", decoded);

        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        req.authUserId = decoded.userId;

        console.log("Authenticated user ID:", req.authUserId);

        next();

    } catch (error) {
        console.error("PROTECT MIDDLEWARE ERROR:", error);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

export default protect;