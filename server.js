const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected to Evalio Database'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes Configuration
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/exams', require('./routes/exams'));
app.use('/api/results', require('./routes/results'));

// Fallback to index.html for undefined routes (SPA behavior/Static)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
