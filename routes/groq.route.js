const express = require('express');
const { check, validationResult } = require('express-validator');
const { handleGroqRequest } = require('../controllers/groq.controller'); // Import controller

const router = express.Router();

router.post(
  '/',
  [
    check('prompt', 'Prompt is required').not().isEmpty(), // Validation check
  ],
  handleGroqRequest // Call the controller method
);

module.exports = router;
