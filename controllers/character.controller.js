const Character = require('../models/character.model');
const { validationResult } = require('express-validator');
const uploadToCloudinary = require('../helpers/cloud.helper');

// Get Character by ID
exports.getCharacter = async (req, res) => {
    try {
        const character = await Character.findById(req.params.id).populate('storyId');
        if (!character) return res.status(404).json({ message: 'Character not found' });
        res.status(200).json(character);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create New Character with Image Upload
exports.createCharacter = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { name, storyId, description } = req.body;

        // Upload image to Cloudinary if present
        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadToCloudinary(req.file.buffer);
        }

        const newCharacter = new Character({
            name,
            storyId,
            image: imageUrl, // Store the Cloudinary image URL
            description
        });

        await newCharacter.save();
        res.status(201).json({ message: 'Character created successfully', character: newCharacter });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Character with Image Upload
exports.updateCharacter = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, storyId, description } = req.body;
        let updatedFields = { name, storyId, description };

        // Upload new image if present
        if (req.file) {
            const imageUrl = await uploadToCloudinary(req.file.buffer);
            updatedFields.image = imageUrl;
        }

        const updatedCharacter = await Character.findByIdAndUpdate(req.params.id, updatedFields, { new: true, runValidators: true });
        if (!updatedCharacter) return res.status(404).json({ message: 'Character not found' });

        res.status(200).json({ message: 'Character updated successfully', character: updatedCharacter });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Character
exports.deleteCharacter = async (req, res) => {
    try {
        const character = await Character.findByIdAndDelete(req.params.id);
        if (!character) return res.status(404).json({ message: 'Character not found' });
        res.status(200).json({ message: 'Character deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
