const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const { protect } = require('./auth');

// @route   POST /api/results
// @desc    Submit an exam result
// @access  Private/Student
router.post('/', protect, async (req, res) => {
    try {
        const newResult = new Result({
            ...req.body,
            userId: req.user.id
        });
        const saved = await newResult.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/results
// @desc    Get all results (Admin) or user results (Student)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if(req.user.role !== 'admin') {
            query.userId = req.user.id;
        }
        
        const results = await Result.find(query)
            .populate('examId', 'title questions.length')
            .populate('userId', 'name email')
            .sort({ date: -1 });
            
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
