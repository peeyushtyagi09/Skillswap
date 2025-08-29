const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    profilePic: {
        type: String, // URL to the profile picture
        default: '',
    },
    age: {
        type: Number,
        min: 0,
    },
    educationLevel: {
        type: String,
        enum: [
            'High School',
            'Associate Degree',
            'Bachelor\'s Degree',
            'Master\'s Degree',
            'Doctorate',
            'Other',
            '',
        ],
        default: '',
    },
    bio: {
        type: String,
        maxlength: 500,
        default: '',
    },
    skillsHave: [{
        type: String,
        trim: true,
    }],
    skillsWant: [{
        type: String,
        trim: true,
    }],
    certificates: [{
        name: { type: String, trim: true, required: true },
        issuer: { type: String, trim: true, required: true },
        date: { type: Date },
        url: { type: String, trim: true }, // For backward compatibility
        fileUrl: { type: String, trim: true }, // New field for uploaded files
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);