const mongoose = require('mongoose');

// Custom validator to check if a string is a valid URL
function isValidURL(value) {
    const urlRegex = /^(https?:\/\/)?([\w\-]+)+[\w\.\-]+[\w]+(\/[\w\-._~:\/?#[\]@!$&'()*+,;=]*)?$/;
    return urlRegex.test(value);
}

const mediaSchema = new mongoose.Schema({
    story_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "story",
        unique: true
    },
    images: {
        type: [String],
        required: true,
        validate: {
            validator: function(array) {
                return array.every(isValidURL); // Ensure every image in the array is a valid URL
            },
            message: 'All images must be valid URLs'
        }
    }
}, { timestamps: true });

const media = mongoose.model("media", mediaSchema);
module.exports = media;