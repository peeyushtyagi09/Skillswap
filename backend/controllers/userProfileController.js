const UserProfile = require('../models/UserProfile');
const User = require('../models/User');

// Check if user has profile
exports.checkProfile = async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ email: req.user.email.toLowerCase() });
        if (!profile) {
            return res.status(404).json({ 
                message: "Profile not found",
                hasProfile: false 
            });
        }
        res.json({ 
            profile,
            hasProfile: true 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create user profile
exports.createProfile = async (req, res) => {
    try {
        const { username, age, educationLevel, bio, skillsHave, skillsWant, certificates, profilePic } = req.body;
        
        console.log('Creating profile for email:', req.user.email.toLowerCase());
        console.log('Profile data received:', { username, age, educationLevel, bio, skillsHave, skillsWant, profilePic });
        
        // Check if profile already exists
        const existingProfile = await UserProfile.findOne({ email: req.user.email.toLowerCase() });
        if (existingProfile) {
            return res.status(400).json({ message: "Profile already exists" });
        }

        // Create new profile
        const profile = await UserProfile.create({
            username: username || req.user.Username,
            email: req.user.email.toLowerCase(),
            age,
            educationLevel,
            bio,
            skillsHave: skillsHave || [],
            skillsWant: skillsWant || [],
            certificates: certificates || [],
            profilePic: profilePic || '' // This will now be the actual URL from the frontend
        });

        console.log('Profile created successfully:', profile);
        console.log('Profile picture in created profile:', profile.profilePic);

        res.status(201).json({ 
            message: "Profile created successfully",
            profile 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { age, educationLevel, bio, skillsHave, skillsWant, certificates, profilePic } = req.body;
        
        // Only update profilePic if it's provided in the request
        const updateData = {
            age,
            educationLevel,
            bio,
            skillsHave,
            skillsWant,
            certificates
        };
        
        // Only include profilePic if it's provided and not empty
        if (profilePic !== undefined && profilePic !== null) {
            updateData.profilePic = profilePic;
        }
        
        const profile = await UserProfile.findOneAndUpdate(
            { email: req.user.email.toLowerCase() },
            updateData,
            { new: true, runValidators: true }
        );

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json({ 
            message: "Profile updated successfully",
            profile 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
    try {
        const { profilePic } = req.body;
        
        console.log('Updating profile picture for email:', req.user.email.toLowerCase());
        console.log('Profile picture URL:', profilePic);
        
        if (!profilePic) {
            return res.status(400).json({ message: "Profile picture URL is required" });
        }

        const profile = await UserProfile.findOneAndUpdate(
            { email: req.user.email.toLowerCase() },
            { profilePic },
            { new: true, runValidators: true }
        );

        if (!profile) {
            console.log('Profile not found for email:', req.user.email.toLowerCase());
            return res.status(404).json({ message: "Profile not found" });
        }

        console.log('Profile picture updated successfully:', profile.profilePic);
        console.log('Full profile after update:', profile);
        res.json({ 
            message: "Profile picture updated successfully",
            profile 
        });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add certificate
exports.addCertificate = async (req, res) => {
    try {
        const { name, issuer, date, url, fileUrl } = req.body;
        
        if (!name || !issuer || (!url && !fileUrl)) {
            return res.status(400).json({ message: "Certificate name, issuer, and either URL or file are required" });
        }

        const profile = await UserProfile.findOne({ email: req.user.email.toLowerCase() });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const newCertificate = {
            name,
            issuer,
            date: date || new Date(),
            url: url || '',
            fileUrl: fileUrl || ''
        };

        profile.certificates.push(newCertificate);
        await profile.save();

        res.json({ 
            message: "Certificate added successfully",
            certificate: newCertificate,
            profile 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove certificate
exports.removeCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;
        
        const profile = await UserProfile.findOne({ email: req.user.email.toLowerCase() });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        profile.certificates = profile.certificates.filter(
            cert => cert._id.toString() !== certificateId
        );
        await profile.save();

        res.json({ 
            message: "Certificate removed successfully",
            profile 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user profile (self)
exports.getProfile = async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ email: req.user.email.toLowerCase() });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        
        // Debug: Log the profile data
        console.log('Profile being returned:', profile);
        console.log('Profile picture in getProfile:', profile.profilePic);
        
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get profile by another user's id
exports.getProfileByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const profile = await UserProfile.findOne({ email: user.email.toLowerCase() });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Test endpoint to manually set profile picture (for debugging)
exports.testUpdateProfilePicture = async (req, res) => {
    try {
        const { profilePic } = req.body;
        console.log('Test update - Email:', req.user.email.toLowerCase());
        console.log('Test update - Profile picture URL:', profilePic);
        
        // First, let's find the profile to see what we're working with
        const existingProfile = await UserProfile.findOne({ email: req.user.email.toLowerCase() });
        console.log('Existing profile before update:', existingProfile);
        
        const profile = await UserProfile.findOneAndUpdate(
            { email: req.user.email.toLowerCase() },
            { profilePic },
            { new: true, runValidators: true }
        );

        if (!profile) {
            console.log('Profile not found for test update');
            return res.status(404).json({ message: "Profile not found" });
        }

        console.log('Test update successful - Profile picture:', profile.profilePic);
        console.log('Full profile after update:', profile);
        
        // Let's also verify by fetching the profile again
        const verifyProfile = await UserProfile.findOne({ email: req.user.email.toLowerCase() });
        console.log('Verification - Profile picture after update:', verifyProfile?.profilePic);
        
        res.json({ 
            message: "Test profile picture update successful",
            profile,
            verification: verifyProfile
        });
    } catch (error) {
        console.error('Test update error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Direct test endpoint using profile ID (for debugging)
exports.testUpdateProfilePictureById = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const { profileId } = req.params;
        
        console.log('Test update by ID - Profile ID:', profileId);
        console.log('Test update by ID - Profile picture URL:', profilePic);
        
        const profile = await UserProfile.findByIdAndUpdate(
            profileId,
            { profilePic },
            { new: true, runValidators: true }
        );

        if (!profile) {
            console.log('Profile not found for test update by ID');
            return res.status(404).json({ message: "Profile not found" });
        }

        console.log('Test update by ID successful - Profile picture:', profile.profilePic);
        res.json({ 
            message: "Test profile picture update by ID successful",
            profile 
        });
    } catch (error) {
        console.error('Test update by ID error:', error);
        res.status(500).json({ message: error.message });
    }
};