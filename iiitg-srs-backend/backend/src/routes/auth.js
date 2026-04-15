const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// ✅ IMPORTANT: no brackets here
router.post('/login', authController.login);

module.exports = router;
