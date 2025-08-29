const Discuss = require('../models/Discuss');
const mongoose = require('mongoose');

// Create a new discussion
exports.createDiscuss = async (req, res) => {
	try {
		const { title, content, imageUrl, tags } = req.body;
		const author = req.user._id;

		const normalizedTags =
			Array.isArray(tags)
				? tags.map(t => String(t).trim()).filter(Boolean)
				: [];

		const discuss = await Discuss.create({ title, content, imageUrl, author, tags: normalizedTags });
		await discuss.populate('author', 'Username email');
		res.status(201).json(discuss);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
// Get all discussions
exports.getAllDiscuss = async (req, res) => {
    try {
        const discusses = await Discuss.find()
            .populate('author', 'Username email')
            .populate('comments.author', 'Username email')
            .sort({ createdAt: -1 });
        res.json(discusses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single discussion by ID
exports.getDiscussById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid discussion ID' });
        }
        const discuss = await Discuss.findById(req.params.id)
            .populate('author', 'Username email')
            .populate('comments.author', 'Username email');
        if (!discuss) {
            return res.status(404).json({ message: 'Discussion not found' });
        }
        res.json(discuss);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a comment to a discussion
exports.addComment = async (req, res) => {
	try {
		const { content, imageUrl } = req.body; // accept optional imageUrl
		const discuss = await Discuss.findById(req.params.id);
		if (!discuss) {
			return res.status(404).json({ message: 'Discussion not found' });
		}
		const comment = {
			content,
			imageUrl,
			author: req.user._id,
			createdAt: new Date()
		};
		discuss.comments.push(comment);
		await discuss.save();
		// Populate the author field of the last comment
		await discuss.populate('comments.author', 'Username email');
		res.status(201).json(discuss.comments[discuss.comments.length - 1]);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Delete a discussion (only by author)
exports.deleteDiscuss = async (req, res) => {
    try {
        const discuss = await Discuss.findById(req.params.id);
        if (!discuss) {
            return res.status(404).json({ message: 'Discussion not found' });
        }
        if (discuss.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await discuss.deleteOne();
        res.json({ message: 'Discussion deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
 
// Delete a comment (only by comment author)
exports.deleteComment = async (req, res) => {
	try {
		const discuss = await Discuss.findById(req.params.id);
		if (!discuss) {
			return res.status(404).json({ message: 'Discussion not found' });
		}
		const comment = discuss.comments.id(req.params.commentId);
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' });
		}
		if (comment.author.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: 'Not authorized' });
		}
		// Mongoose 8: remove() is gone; use pull() or subdoc.deleteOne()
		discuss.comments.pull({ _id: req.params.commentId });
		await discuss.save();
		return res.json({ message: 'Comment deleted' });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};


exports.searchDiscuss = async (req, res) => {
	try {
		const { q = '' } = req.query;
		const queryStr = String(q).trim();
		if (!queryStr) return res.status(400).json({ message: 'Search query required' });

		// split on whitespace, keep up to 10 tokens
		const tokens = queryStr.split(/\s+/).filter(Boolean).slice(0, 10);

		// AND across tokens; each token may match title/content or tags
		const andClauses = tokens.map(t => {
			const tag = t.replace(/^#/, '');
			return {
				$or: [
					{ title: { $regex: t, $options: 'i' } },
					{ content: { $regex: t, $options: 'i' } },
					// case-insensitive tag match
					{ tags: { $in: [new RegExp(`^${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')] } }
				]
			};
		});

		// ...
const mongoQuery = andClauses.length ? { $and: andClauses } : {};

const results = await Discuss.find(mongoQuery)
    .populate('author', 'Username email')
    .populate('comments.author', 'Username email')
    .sort({ createdAt: -1 })
    .exec();

res.json(results);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Increment vote 
// Increment vote (one vote per user)
exports.voteDiscussion = async (req, res) => {
	try {
		const userId = req.user._id;
		const updated = await Discuss.findOneAndUpdate(
			{ _id: req.params.id, likes: { $ne: userId } },
			{ $addToSet: { likes: userId }, $inc: { votes: 1 } },
			{ new: true }
		)
			.populate('author', 'Username email')
			.populate('comments.author', 'Username email');

		if (updated) return res.json(updated);

		const discussion = await Discuss.findById(req.params.id)
			.populate('author', 'Username email')
			.populate('comments.author', 'Username email');
		if (!discussion) return res.status(404).json({ message: "Discussion not found" });
		return res.json(discussion); // already voted
	} catch (err) {
		res.status(500).json({ message: err.message || "Failed to vote" });
	}
};

// Increment view (one view per user)
exports.viewDiscussion = async (req, res) => {
	try {
		const userId = req.user._id;
		const updated = await Discuss.findOneAndUpdate(
			{ _id: req.params.id, viewedBy: { $ne: userId } },
			{ $addToSet: { viewedBy: userId }, $inc: { views: 1 } },
			{ new: true }
		)
			.populate('author', 'Username email')
			.populate('comments.author', 'Username email');

		if (updated) return res.json(updated);

		const discussion = await Discuss.findById(req.params.id)
			.populate('author', 'Username email')
			.populate('comments.author', 'Username email');
		if (!discussion) return res.status(404).json({ message: "Discussion not found" });
		return res.json(discussion); // already viewed
	} catch (err) {
		res.status(500).json({ message: err.message || "Failed to register view" });
	}
};