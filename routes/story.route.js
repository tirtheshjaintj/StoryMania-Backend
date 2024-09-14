const { Router } = require('express');
const { check } = require('express-validator');
const { getStory, createStory, updateStory, deleteStory, getStories,addAuthorToStory} = require('../controllers/story.controller');
const router = Router();
const { restrictLogIn } = require('../middlewares/authCheck');
const upload = require('../middlewares/multer');

// Get Story
router.get('/:id', 
    check('id').isMongoId().withMessage('Invalid story ID'),
    getStory
);

router.put('/stories', 
    getStories
);

// Create New Story
router.post('/create',
    upload.array('images'), // Handle multiple image uploads
    (req,res,next)=>{
       req.body.tags=JSON.parse(req.body.tags);
       next();
    }, 
    [
        check('title').notEmpty().withMessage('Title is required')
            .isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
        check('plot').notEmpty().withMessage('Plot is required'),
        check('genre').isIn( ['Adventure', 'Romance', 'Sci-Fi', 'Fantasy', 'Mystery']).withMessage('Invalid genre')
    ],
    restrictLogIn,
    createStory
);

// Update Story  
router.put('/update/:id',
    upload.array('images'), // Handle multiple image uploads
    (req,res,next)=>{
       req.body.tags=JSON.parse(req.body.tags);
       next();
    }, 
    [
        check('id').isMongoId().withMessage('Invalid story ID'),
        check('title').optional().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
        check('plot').optional().matches(/<[^>]+>/).withMessage('Plot must be in HTML format'),
        check('authors').optional().isArray({ min: 1 }).withMessage('At least one author is required'),
        check('genre').optional().isIn(['Adventure','Fantasy', 'Science Fiction', 'Historical Fiction', 'Mystery', 'Thriller', 'Romance']).withMessage('Invalid genre')
    ],
    restrictLogIn,
    updateStory
);

// Add Author to Story
router.patch('/stories/:id/add-author',
    check('id').isMongoId().withMessage('Invalid story ID'),
    check('authorId').notEmpty().withMessage('Author ID is required').isMongoId().withMessage('Invalid Author ID'),
    restrictLogIn,
    addAuthorToStory // Controller function to handle adding the author
);

// Delete Story
router.delete('/delete/:id', 
    check('id').isMongoId().withMessage('Invalid story ID'),
    restrictLogIn,
    deleteStory
);

module.exports = router;
