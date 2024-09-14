const { Router } = require('express');
const { check } = require('express-validator');
const { getCharacter, createCharacter, updateCharacter, deleteCharacter } = require('../controllers/character.controller');
const router = Router();
const { restrictLogIn } = require('../middlewares/authCheck');
const upload = require('../middlewares/multer');

// Get Character
router.get('/:id', 
    check('id').isMongoId().withMessage('Invalid character ID'),
    getCharacter
);

// Create New Character
router.post('/create', 
    upload.single('image'),
    [
        check('name').notEmpty().withMessage('Name is required')
            .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces')
            .isLength({ min: 1, max: 15 }).withMessage('Name must be between 1 and 15 characters'),
        check('storyId').isMongoId().withMessage('Story ID is required and must be a valid MongoDB ObjectId'),
        check('image').optional().isURL().withMessage('Image must be a valid URL'),
        check('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long')
    ],
    restrictLogIn,
    createCharacter
);

// Update Character
router.put('/update/:id',
    upload.single('image'), 
    [
        check('id').isMongoId().withMessage('Invalid character ID'),
        check('name').optional().matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces')
            .isLength({ min: 1, max: 15 }).withMessage('Name must be between 1 and 15 characters'),
        check('storyId').optional().isMongoId().withMessage('Story ID must be a valid MongoDB ObjectId'),
        check('image').optional().isURL().withMessage('Image must be a valid URL'),
        check('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long')
    ],
    restrictLogIn,
    updateCharacter
);

// Delete Character
router.delete('/delete/:id', 
    check('id').isMongoId().withMessage('Invalid character ID'),
    restrictLogIn,
    deleteCharacter
);

module.exports = router;
