const Story = require('../models/story.model');
const Media = require('../models/media.model'); // Add this to handle media separately
const User=require("../models/user.model");
const { validationResult } = require('express-validator');
const uploadToCloudinary = require('../helpers/cloud.helper'); // Cloudinary helper for image uploads
const mongoose = require('mongoose');

exports.getStory = async (req, res) => {
    try {
        // Find the story by ID
        const story = await Story.findById(req.params.id).lean(); // Use .lean() for plain JavaScript object
        if (!story) return res.status(404).json({ message: 'Story not found' });

        // Fetch the media for this specific story
        const media = await Media.find({ story_id: story._id }).lean();
        const mediaUrls = media.map(m => m.images).flat(); // Flatten arrays if necessary

        // Fetch the author names by querying the User model
        const authorIds = story.authors; // Assuming 'authors' is an array of author IDs in the story document
        const authors = await User.find({ _id: { $in: authorIds } }).select('name').lean();

        // Map author IDs to names
        const authorMap = authors.reduce((acc, author) => {
            acc[author._id] = author.name;
            return acc;
        }, {});

        // Replace author IDs with their names
        const authorNames = story.authors.map(authorId => authorMap[authorId] || 'Unknown Author');

        // Combine the story with its media and author names
        const storyWithDetails = {
            ...story,
            media: mediaUrls || [],  // Attach media or empty array if none found
            authors: authorNames     // Attach author names
        };

        // Return the story with media and author names
        res.status(200).json(storyWithDetails);
    } catch (error) {
        console.error("Error fetching story:", error); // Add logging for better debugging
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// Controller function to add an author to a story
exports.addAuthorToStory = async (req, res) => {
    const { authorId } = req.body; // Expecting authorId as MongoDB ObjectId
    console.log(authorId);
    try {
        if (!authorId) {
            return res.status(400).json({ message: 'Author ID is required' });
        }
        // Validate that the authorId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(authorId)) {
            return res.status(400).json({ message: 'Invalid Author ID' });
        }

        const updatedStory = await Story.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { authors: authorId } },
            { new: true, runValidators: true }
        );

        if (!updatedStory) return res.status(404).json({ message: 'Story not found' });
        res.status(200).json({ message: 'Author added successfully', story: updatedStory });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};



exports.getStories = async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    }

    try {
        // Fetch stories
        const stories = await Story.find({}).lean();
        if (stories.length === 0) {
            return res.status(404).json({ status: false, message: 'No stories found' });
        }

        // Fetch all media associated with these stories
        const storyIds = stories.map(story => story._id);
        const media = await Media.find({ story_id: { $in: storyIds } }).lean();

        // Map story IDs to their corresponding media URLs
        const mediaMap = media.reduce((acc, item) => {
            if (!acc[item.story_id]) acc[item.story_id] = [];
            acc[item.story_id] = acc[item.story_id].concat(item.images); // Flatten arrays
            return acc;
        }, {});

        // Extract author IDs from stories
        const authorIds = [...new Set(stories.map(story => story.authors).flat())]; // Unique author IDs

        // Fetch author names from User model
        const authors = await User.find({ _id: { $in: authorIds } }).select('name').lean();

        // Create a map of author IDs to names
        const authorMap = authors.reduce((acc, author) => {
            acc[author._id] = author.name;
            return acc;
        }, {});

        // Attach media and author names to their respective stories
        const storiesWithDetails = stories.map(story => ({
            ...story,
            media: mediaMap[story._id] || [], // Attach media if exist, else an empty array
            authors: story.authors.map(authorId => authorMap[authorId] || 'Unknown Author') // Attach author names
        }));

        return res.status(200).json({
            status: true,
            message: 'Stories received successfully',
            data: storiesWithDetails
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};
// Create New Story
exports.createStory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, plot, tags, genre } = req.body;

        // Default author is the logged-in user
        const authors = [req.user.id];

        const newStory = new Story({
            title,
            plot,
            authors,
            tags,
            genre
        });

        await newStory.save();

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
            const imageUrls = await Promise.all(uploadPromises);

            // Create a Media entry and link it to the story
            const media = new Media({
                story_id: newStory._id,
                images: imageUrls
            });
            
            await media.save();
        }

        res.status(201).json({ message: 'Story created successfully', story: newStory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Story
exports.updateStory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, plot, authors, tags, genre } = req.body;
        let updatedFields = { title, plot, authors, tags, genre };

        const updatedStory = await Story.findByIdAndUpdate(req.params.id, updatedFields, { new: true, runValidators: true });
        if (!updatedStory) return res.status(404).json({ message: 'Story not found' });

        // Handle image uploads if files are provided
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
            const imageUrls = await Promise.all(uploadPromises);

            // Find or create media entry
            let media = await Media.findOne({ story_id: updatedStory._id });
            if (media) {
                media.images = [...media.images, ...imageUrls];
                await media.save();
            } else {
                media = new Media({
                    story_id: updatedStory._id,
                    images: imageUrls
                });
                await media.save();
            }
        }

        res.status(200).json({ message: 'Story updated successfully', story: updatedStory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Story
exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findByIdAndDelete(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        // Delete associated media
        await Media.findOneAndDelete({ story_id: req.params.id });
        res.status(200).json({ message: 'Story deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Add Authors to Story

