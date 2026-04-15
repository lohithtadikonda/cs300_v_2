const router = require('express').Router();
const { getAllCourses, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getAllCourses);
router.post('/', authenticate, authorize('admin'), createCourse);
router.put('/:id', authenticate, authorize('admin'), updateCourse);
router.delete('/:id', authenticate, authorize('admin'), deleteCourse);

module.exports = router;
