const mongoose = require('mongoose');

// Define the schema
const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [1, 'Name must be at least 1 character long'],
    maxlength: [15, 'Name cannot exceed 15 characters'],
    validate: {
      validator: function (v) {
        return /^[a-zA-Z\s]+$/.test(v); // Only letters and spaces allowed
      },
      message: props => `${props.value} is not a valid name! Only letters and spaces are allowed.`
    }
  },
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'story',
    required: [true, 'Story reference is required']
  },
  image: {
    type: String,
    validate: {
      validator: function (v) {
        return /^(http|https):\/\/[^ "]+$/.test(v); // Basic URL validation
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  description: {
    type: String,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9\s,.'-]{10,}$/.test(v); // At least 10 characters and allows basic punctuation
      },
      message: props => `${props.value} is not a valid description! Must be at least 10 characters long.`
    }
  }
}, { timestamps: true });

// Compile the model
const Character = mongoose.model('Character', characterSchema);

module.exports = Character;
