const express = require('express');
const router = express.Router();

// Route modules
const chatRoutes = require('./chat');
const callsRoutes = require('./calls');
const summaryRoutes = require('./summary');

// Mount routes
router.use('/chat', chatRoutes);
router.use('/calls', callsRoutes);
router.use('/summary', summaryRoutes);

module.exports = router;
