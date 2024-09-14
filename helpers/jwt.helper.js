const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const expiresIn=process.env.TOKEN_EXPIRATION;

function setUser(user) {
    return jwt.sign({id:user._id},JWT_SECRET, { expiresIn});
}
function getUser(token) {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (err) {
        console.log(err);
        return null;
    }
}

module.exports = { getUser, setUser };
