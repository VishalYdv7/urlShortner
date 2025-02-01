// Import necessary libraries
const express = require('express');
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
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

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
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clicks: [
    {
      timestamp: { type: Date, default: Date.now },
      ipAddress: String,
      device: String,
      location: String,
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

  jwt.verify(token.replace('Bearer ', ''), process.env.SECRET_KEY, (err, decoded) => {
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, mobile, password } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const newUser = new User({ name, email, mobile, password: hashedPassword });
      await newUser.save();

      // Send success response
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
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
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
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
    console.error('Error creating short URL:', error);
    res.status(500).json({ message: 'Error creating short URL', error: error.message });
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
    console.error('Error redirecting:', error);
    res.status(500).json({ message: 'Error redirecting', error: error.message });
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
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
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
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// Fetch all links created by the user
app.get('/links', authenticate, async (req, res) => {
  try {
    const urls = await URL.find({ createdBy: req.user.id });
    res.status(200).json(urls);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ message: 'Error fetching links', error: error.message });
  }
});

// Fetch a single link by ID
app.get('/links/:id', authenticate, async (req, res) => {
  try {
    const url = await URL.findById(req.params.id);
    if (!url || url.createdBy.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Link not found' });
    }
    res.status(200).json(url);
  } catch (error) {
    console.error('Error fetching link:', error);
    res.status(500).json({ message: 'Error fetching link', error: error.message });
  }
});

// Update a link
app.put('/links/:id', authenticate, async (req, res) => {
  const { url, remarks, isExpirable, expirationDate } = req.body;

  try {
    const link = await URL.findById(req.params.id);
    if (!link || link.createdBy.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Link not found' });
    }

    link.originalUrl = url || link.originalUrl;
    link.remarks = remarks || link.remarks;
    link.expirationDate = isExpirable ? expirationDate : null;
    await link.save();

    res.status(200).json(link);
  } catch (error) {
    console.error('Error updating link:', error);
    res.status(500).json({ message: 'Error updating link', error: error.message });
  }
});

// Delete a link
app.delete('/links/:id', authenticate, async (req, res) => {
  try {
    const link = await URL.findById(req.params.id);
    if (!link || link.createdBy.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Link not found' });
    }

    await link.remove();
    res.status(200).json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ message: 'Error deleting link', error: error.message });
  }
});

// Fetch user profile
app.get('/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ name: user.name, email: user.email, mobile: user.mobile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

// Update user profile
app.put('/settings', authenticate, async (req, res) => {
  const { name, email, mobile } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    await user.save();

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Delete user account
app.delete('/settings', authenticate, async (req, res) => {
  try {
    console.log('Deleting account:', req.user.id);
    await User.findByIdAndDelete(req.user.id);
    await URL.deleteMany({ createdBy: req.user.id });
    res.status(200).json({ message: 'Account and associated URLs deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});