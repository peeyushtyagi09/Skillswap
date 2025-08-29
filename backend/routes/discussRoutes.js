const express = require("express");
const {
  createDiscuss,
  getAllDiscuss,
  getDiscussById,
  addComment,
  deleteDiscuss,
  deleteComment,
  searchDiscuss,
  voteDiscussion,
  viewDiscussion
} = require("../controllers/DiscussControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new discussion
router.post("/", protect, createDiscuss);

// Get all discussions
router.get("/", getAllDiscuss);

// for searching - MUST be before /:id route
router.get("/search", (req, res, next) => {
  // Ensure a query parameter is provided
  if (!req.query.q || req.query.q.trim() === "") {
    return res.status(400).json({ message: "Search query is required." });
  }
  // Call the controller
  searchDiscuss(req, res, next);
});

// Get a single discussion by ID
router.get("/:id", getDiscussById);

// Add a comment to a discussion
router.post("/:id/comments", protect, addComment);

// Delete a discussion (only by author)
router.delete("/:id", protect, deleteDiscuss);

// Delete a comment (only by comment author)
router.delete("/:id/comments/:commentId", protect, deleteComment);

router.post("/:id/vote", protect, voteDiscussion);
router.post("/:id/view", protect, viewDiscussion);

module.exports = router;
