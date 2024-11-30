const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const { setUser } = require('../helpers/jwt.helper');
const sendMail = require('../helpers/mail.helper');
const crypto = require('crypto');
const Story = require('../models/story.model'); // Adjust the path as necessary
const Media = require('../models/media.model'); // Adjust the path as necessary

const searchUsers = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    }

    const { query } = req.query; // Expect query parameter for search term

    try {
        // Perform a case-insensitive search on name, email, or phone number
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { phone_number: { $regex: query, $options: 'i' } }
            ]
        }).select('-password -otp -__v -verified'); // Exclude sensitive fields

        if (users.length === 0) {
            return res.status(404).json({ status: false, message: 'No users found' });
        }

        return res.status(200).json({
            status: true,
            message: 'Users retrieved successfully',
            data: users
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, verified: true });
        if (!user) {
            return res.status(400).json({ status: false, message: 'Invalid email or password.' });
        }

        const isMatch = await user.isPasswordCorrect(password);
        if (!isMatch) {
            return res.status(400).json({ status: false, message: 'Invalid email or password.' });
        }

        const token = setUser(user);
        const rec_email=user.email;
        const mailStatus = await sendMail('IMP: You Logged In as User on new Device', rec_email, 
            `IMP Just wanted to let you know that your account has been loggedIn in a new device`);
            
        res.status(200).json({ status: true, message: 'Login successful!', token });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};

const signup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    }

    const { name, email, phone_number, address, password } = req.body;
    const otp = crypto.randomInt(100000, 999999).toString(); // Generate OTP

    try {
        // Check if the user with the given email already exists and is verified
        const existingUser = await User.findOne({ email, verified: true });
        if (existingUser) {
            return res.status(400).json({ status: false, message: 'User already exists with this email.' });
        }

        // Check if the user with the given phone number already exists and is verified
        const existingUser2 = await User.findOne({ phone_number, verified: true });
        if (existingUser2) {
            return res.status(400).json({ status: false, message: 'User already exists with this phone number.' });
        }

        let user;
        const newUser = await User.findOne({ email, verified: false });

        if (!newUser) {
            user = await User.create({ name, email, phone_number, address, password, otp });
        } else {
            // Update existing useer
            newUser.phone_number = phone_number;
            newUser.address = address;
            newUser.otp = otp; // Set OTP
            newUser.password = password;
            await newUser.save();
            user = newUser;
        }

        const mailStatus = await sendMail('IMP: Your OTP Code', email, `Your OTP code is ${otp}`);
        if (mailStatus) {
    // Respond with success and the created user
            res.status(201).json({ status: true, message: 'Verification is Needed!', user });
        } else {
            res.status(500).json({ status: false, message: 'Failed to send OTP.' });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};

const google_login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    }

    const { email, google_id, name } = req.body;

    try {
        // Check if the user exists
        let user = await User.findOne({email});

        if (!user) {
            // Generate random details for signup
            const randomPassword = Math.random().toString(36).slice(-8); // Random strong password of length 8
            const randomPhoneNumber = `9${Math.floor(100000000 + Math.random() * 900000000)}`; // Random unique 10-digit phone number
            const dummyAddress = "Dummy Address, Not Provided";
            // Create a new user with the provided Google ID and other dummy details
            user = await User.create({
                name,
                email,
                google_id,
                phone_number: randomPhoneNumber,
                address: dummyAddress,
                password: randomPassword,
                verified: true, // Mark user as verified since logged in with Google
            });
            // Optionally, send a welcome email with login details (optional step)
            const welcomeMailStatus = await sendMail(
                "Welcome to Our Service!",
                email,
                `Dear ${name},\n\nYour account has been successfully created via Google Login.\n\nLogin Details:\nEmail: ${email}\nTemporary Password: ${randomPassword}\n\nPlease change your password after login.`
            );
            if (!welcomeMailStatus) {
                console.error("Failed to send welcome email.");
            }
        } else {
            // If the user exists, validate Google ID
            if (user.google_id && user.google_id !== google_id) {
                return res.status(400).json({ status: false, message: 'Invalid Google ID' });
            }
            // Associate the Google ID with the user
            user.google_id = google_id;
            await user.save();
        }

        user.otp=null;
        user.verified=true;
        await user.save();
        // Generate JWT token for the user
        const token = setUser(user);
        // Notify user about login via email (optional step)
        const mailStatus = await sendMail(
            'IMP: You Logged In on a New Device',
            email,
            `Dear ${name},\n\nYour account has been logged in on a new device.\n\nIf this wasn't you, please contact our support team immediately.`
        );
        if (!mailStatus) {
            console.error("Failed to send login notification email.");
        }
        // Respond with success
        res.status(200).json({ status: true, message: 'Login successful!', token });
    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};


const updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    }

    const { name, email, phone_number, address } = req.body;

    try {
        const userId = req.user.id; // Assuming user ID is extracted from a middleware

        const user = await User.findByIdAndUpdate(
            userId, 
            { name, email, phone_number, address },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found.' });
        }

        res.status(200).json({ status: true, message: 'User details updated successfully!', user });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};

const verifyOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    }

    const { otp } = req.body;
    const { userid } = req.params;

    try {
        const user = await User.findOne({ _id: userid, otp, verified: false });
        if (!user) {
            return res.status(400).json({ status: false, message: 'Invalid OTP or user already verified.' });
        }

        await User.findByIdAndUpdate(user._id, { verified: true, otp: null });
        const mailStatus = await sendMail('IMP: Account Verified Successfully ✅', user.email, `Hello ${user.name}, Congratulations 🎉 your account is now verified and now you can start buying products.`);

        if (!mailStatus) {
            res.status(500).json({ status: false, message: 'Internal Server Error' });
        }

        const token = setUser(user);
        res.status(200).json({ status: true, message: 'Login successful!', token });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};

const resendOtp = async (req, res) => {
    const { userid } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    }
    try {
        const user = await User.findOne({ _id: userid, verified: false });
        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found or already verified.' });
        }

        const newOtp = crypto.randomInt(100000, 999999).toString();
        await User.findByIdAndUpdate(user._id, { otp: newOtp });
        const mailStatus = await sendMail('IMP: Your new OTP Code', user.email, `Your new OTP code is ${newOtp}`);

        if (mailStatus) {
            res.status(200).json({ status: true, message: 'New OTP sent successfully!' });
        } else {
            res.status(500).json({ status: false, message: 'Failed to send OTP.' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};

const getUser =async (req, res) => {
 try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password -otp -__v -verified");
    if(!user) res.status(500).json({ status: false, message: 'User Not Found' });
    return res.status(200).json({ status:true, user });
 } catch (error) {
    res.status(500).json({ status: false, message: 'Internal Server Error' });
 }
};

const getStories = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    }

    try {
        const userId = req.user.id; // Assuming user ID is available in req.user

        // Fetch stories for the logged-in user
        const stories = await Story.find({ authors: userId }).lean();

        if (stories.length === 0) {
            return res.status(404).json({ status: false, message: 'No stories found' });
        }

        // Fetch all media associated with these stories
        const storyIds = stories.map(story => story._id);
        const media = await Media.find({ story_id: { $in: storyIds } }).lean();

        // Log media to debug
        console.log('Media:', media);

        // Map story IDs to their corresponding media URLs
        const mediaMap = media.reduce((acc, item) => {
            if (!acc[item.story_id]) acc[item.story_id] = [];
            acc[item.story_id] = acc[item.story_id].concat(item.images); // Flatten arrays
            return acc;
        }, {});

        // Log mediaMap to debug
        console.log('Media Map:', mediaMap);

        // Attach media to their respective stories
        const storiesWithDetails = stories.map(story => ({
            ...story,
            media: mediaMap[story._id] || [] // Attach media if exist, else an empty array
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

module.exports = {
    signup,
    login,
    updateUser,
    verifyOtp,
    resendOtp,
    getUser,
    getStories,
    searchUsers,
    google_login
};
