const mongoose = require('mongoose');

// Define the schema
const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  plot: {
    type: String,
    required: [true, 'Plot is required'],
  },
  authors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: [true, 'At least one author is required']
  }],
  tags: [{
    type: String,
    trim: true
  }],
  genre: {
    type: String,
    enum: ['Adventure', 'Romance', 'Sci-Fi', 'Fantasy', 'Mystery'],
    required: [true, 'Genre is required']
  },
  status:{
    type:Boolean,
    default: false
  }
}, { timestamps: true });

// Compile the model
const Story = mongoose.model('Story', storySchema);

module.exports = Story;
