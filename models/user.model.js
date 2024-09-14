const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    validate: {
      validator: function (v) {
        return /^[a-zA-Z\s]+$/.test(v);
      },
      message: props => `${props.value} is not a valid name! Only letters and spaces are allowed.`
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    validate: {
      validator: function (v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  phone_number: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function (v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number! It should contain exactly 10 digits.`
    }
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9\s,.'-]{10,}$/.test(v);
      },
      message: props => `${props.value} is not a valid address!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: function (v) {
        return /^.{8,}$/.test(v);
      },
      message: props => `Password must be at least 8 characters long.`
    }
  },
  otp: {
    type: String,
    validate: {
      validator: function (val) {
        return val.length == 6;
      },
      message: () => `OTP must be 6 digits`
    }
  },
  verified: {
    type: Boolean,
    default: false,
    required: true
  }
},{timestamps:true});

// Middleware to hash password and generate OTP before saving
userSchema.pre('save', async function (next) {

try {

if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
}

next();
} catch (error) {
    next(error);
}

});

// Method to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Compile the model
const User = mongoose.model('User', userSchema);

module.exports = User;
