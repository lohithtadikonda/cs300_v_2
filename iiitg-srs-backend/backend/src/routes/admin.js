const router = require('express').Router();
const { getSettings, updateSettings, getAllUsers, createUser } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/settings', authenticate, authorize('admin'), getSettings);
router.put('/settings', authenticate, authorize('admin'), updateSettings);
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.post('/users', authenticate, authorize('admin'), createUser);

module.exports = router;
