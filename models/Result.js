const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    examId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Exam',
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    timeTaken: { type: Number, required: true }, // in seconds
    answers: { type: Map, of: Number }, // User's selected options (questionIndex -> optionIndex)
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);
