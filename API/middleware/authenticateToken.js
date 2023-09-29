const jwt = require('jsonwebtoken');
const env = require('dotenv').config();
//authenticates token and puts user data inside it
function authenticateToken(req, res, next) {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        // Log a message indicating successful token validation
        console.log('Token validated successfully for user:', user);
        req.user = user; 
        next();
    });
}

module.exports = authenticateToken;