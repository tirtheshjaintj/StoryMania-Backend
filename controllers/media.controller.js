const Media = require('../models/media.model');

const removeImage = async (req, res) => {
    const { imageUrl } = req.body;
    const product_id = req.params.id;
    try {
        // Find the media document associated with the product
        const media = await Media.findOne({ product_id });
        if (!media) {
            return res.status(404).json({ status: false, message: 'No media found for this product' });
        }

        // Remove the image URL from the media array
        media.images = media.images.filter(url => url !== imageUrl);
        await media.save();
        res.status(200).json({ status: true, message: 'Image removed successfully' });
    } catch (error) {
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

module.exports={removeImage};