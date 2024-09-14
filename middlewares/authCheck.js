const { getUser } = require("../helpers/jwt.helper");

async function restrictLogIn(req, res, next) {
    try {
        // Correct way to access authorization header (case-insensitive)
        const userId = req.headers["authorization"];
        console.log('Authorization header:', userId);
        // Access tokens safely with optional chaining
        const token = req.cookies?.user_token;
        console.log('Token:', token);
        
        // Get user from token
        const user = getUser(token);        
        // Check if user exists, if not respond with 401 Unauthorized
        if (!user) {
            return res.status(401).json({ status: false, message: "Invalid Login Details" });
        }
        
        // Attach user object to the request
        req.user = user;
        
        // Proceed to next middleware or route handler
        next();
    } catch (error) {
        // Log error for debugging purposes
        console.error('Error in restrictLogIn:', error);
        
        // Respond with 401 Unauthorized if an error occurs
        return res.status(401).json({ status: false, message: "Wrong Details" });
    }
}

module.exports = { restrictLogIn };
