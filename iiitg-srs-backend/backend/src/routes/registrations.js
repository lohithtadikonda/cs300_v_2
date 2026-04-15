const router = require('express').Router();
const { createRegistration, getMyRegistrations, getAllRegistrations, approveRegistration } = require('../controllers/registrationController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('student'), createRegistration);
router.get('/my', authenticate, authorize('student'), getMyRegistrations);
router.get('/all', authenticate, authorize('warden', 'finance', 'student_affairs', 'academic_affairs', 'admin'), getAllRegistrations);
router.post('/:id/approve', authenticate, authorize('warden', 'finance', 'student_affairs', 'academic_affairs', 'admin'), approveRegistration);

module.exports = router;
