const express = require('express');
const cors = require('cors');
require('dotenv').config();
const groqRoutes = require('./routes/groq.route');
const test=require("./routes/test.route");
const app = express();
const connectDB = require('./helpers/db.helper');
const cookieParser = require('cookie-parser');
const user=require("./routes/user.route");
const media=require("./routes/media.route");
const storyRoutes = require('./routes/story.route');
const characterRoutes = require('./routes/character.route');
//MiddleWaress
// app.use(cors());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended:true}))
app.use(express.json());
//DB Connection
connectDB();

const port = process.env.PORT || 3000;

//Testing Route
app.use("/",test);

//User Routes
app.use("/api/user",user);
//Media Routes
app.use("/api/media",media);
// Use the groqRoutes
app.use('/groqBot', groqRoutes);

//Stories and Character Routes
app.use('/api/story', storyRoutes);
app.use('/api/characters', characterRoutes);

app.get('/api/genres', (req, res) => {
    const genres = ['Adventure', 'Romance', 'Sci-Fi', 'Fantasy', 'Mystery']; // List of genres
    return res.json(genres);
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
