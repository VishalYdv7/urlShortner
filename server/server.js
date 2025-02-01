// Import necessary libraries
const express = require('express');
// const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const shortid = require('shortid');
const cors = require('cors');
const bodyParser = require('body-parser');
const device = require('express-device');
const geoip = require('geoip-lite');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(device.capture());

const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB');
});

// Define User schema and model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Define URL schema and model
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clicks: [
    {
      timestamp: { type: Date, default: Date.now },
      ipAddress: String,
      device: String,
    },
  ],
  expirationDate: { type: Date },
  status: { type: String, default: 'Active' },
  remarks: { type: String },
});

const URL = mongoose.model('URL', urlSchema);

// Middleware for authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Register a new user
app.post(
	'/signup',
	[
	  body('name').notEmpty().withMessage('Name is required'),
	  body('email').isEmail().withMessage('Invalid email'),
	  body('mobile').notEmpty().withMessage('Mobile number is required'),
	  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
	],
	async (req, res) => {
	  // Validate request data

	  const { name, email, mobile, password } = req.body;
  
	  try {
		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);
  
		// Create a new user
		const newUser = new User({ name, email, mobile, password: hashedPassword });
		await newUser.save();
  
		// Send success response
		res.status(201).json({ message: 'User registered successfully' });
	  } catch (error) {
		// Handle database errors
		console.error('Error registering user:', error);
		res.status(500).json({ message: 'Error registering user', error: error.message });
	  }
	}
  );

// Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Create a short URL
app.post('/shorten', authenticate, async (req, res) => {
  const { originalUrl, expirationDate, remarks } = req.body;
  const shortUrl = shortid.generate();
  const existingUrl = await URL.findOne({ shortUrl });
  if (existingUrl) {
    return res.status(400).json({ message: 'Short URL collision, please try again' });
  }

  try {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const fullShortUrl = `${baseUrl}/${shortUrl}`;

    const newUrl = new URL({
      originalUrl,
      shortUrl,
      createdBy: req.user.id,
      expirationDate,
      remarks,
    });
    await newUrl.save();

    res.status(201).json({ shortUrl: fullShortUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error creating short URL', error });
  }
});

// Redirect to original URL and log click
app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const urlRecord = await URL.findOne({ shortUrl });
    if (!urlRecord) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (urlRecord.expirationDate && new Date() > urlRecord.expirationDate) {
      urlRecord.status = 'Inactive';
      await urlRecord.save();
      return res.status(410).json({ message: 'URL expired' });
    }

    const location = geoip.lookup(req.ip)?.country || 'Unknown';
    const clickData = {
      timestamp: new Date(),
      ipAddress: req.ip,
      device: req.device.type,
      location,
    };
    urlRecord.clicks.push(clickData);
    await urlRecord.save();

    res.redirect(urlRecord.originalUrl);
  } catch (error) {
    res.status(500).json({ message: 'Error redirecting', error });
  }
});

// Get analytics for a URL
app.get('/analytics/:shortUrl', authenticate, async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const urlRecord = await URL.findOne({ shortUrl, createdBy: req.user.id });
    if (!urlRecord) {
      return res.status(404).json({ message: 'URL not found or not authorized' });
    }

    res.status(200).json({
      totalClicks: urlRecord.clicks.length,
      clicks: urlRecord.clicks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error });
  }
});

// Dashboard: Get aggregated analytics for all links
app.get('/dashboard', authenticate, async (req, res) => {
  try {
    const urls = await URL.find({ createdBy: req.user.id });

    // Calculate total clicks
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks.length, 0);

    // Calculate device-wise clicks
    const deviceWiseClicks = urls.reduce((acc, url) => {
      url.clicks.forEach(click => {
        acc[click.device] = (acc[click.device] || 0) + 1;
      });
      return acc;
    }, {});

    // Calculate clicks for the last 4 dates
    const dateWiseClicks = {};
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      // Filter clicks for this date
      const clicksOnDate = urls.reduce((sum, url) => {
        return sum + url.clicks.filter(click => {
          const clickDate = new Date(click.timestamp).toISOString().split('T')[0];
          return clickDate === dateString;
        }).length;
      }, 0);

      dateWiseClicks[dateString] = clicksOnDate;
    }

    res.status(200).json({
      totalClicks,
      deviceWiseClicks,
      dateWiseClicks,
      urls: urls.map(url => ({
        shortUrl: url.shortUrl,
        originalUrl: url.originalUrl,
        clicks: url.clicks.length,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});