const express = require('express');
const { check } = require('express-validator');
const { restrictLogIn } = require('../middlewares/authCheck');
const { removeImage } = require('../controllers/media.controller');
const router = express.Router();

// Remove image route
router.delete('/removeimg/:id',
    restrictLogIn,
    [
        check('product_id').isMongoId().withMessage('Product ID is required and must be a valid MongoDB ObjectId'),
        check('image_url').isURL().withMessage('Image URL is required and must be a valid URL')
    ],
    removeImage
);

module.exports = router;