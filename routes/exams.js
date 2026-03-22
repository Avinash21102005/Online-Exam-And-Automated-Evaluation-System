const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const { protect } = require('./auth');

// @route   GET /api/exams
// @desc    Get all active exams
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const exams = await Exam.find().sort({ createdAt: -1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/exams/:id
// @desc    Get single exam by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if(!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/exams
// @desc    Create an exam
// @access  Private/Admin
router.post('/', protect, async (req, res) => {
    if(req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    
    try {
        const newExam = new Exam({
            ...req.body,
            createdBy: req.user.id
        });
        const saved = await newExam.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/exams/:id
// @desc    Delete an exam
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
    if(req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    try {
        await Exam.findByIdAndDelete(req.params.id);
        res.json({ message: 'Exam deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
