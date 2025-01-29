
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');
const validateRequest = require('../middleware');
const { validateReview, validateReviewUpdate } = require('../validators/reviewValidator');

// Public routes
router.get('/public/:userId', reviewController.getUserReviews);

// Protected routes
router.use(verifyToken);

// Create review
//router.post('/', validateReview, validateRequest, reviewController.createReview);

// Get user's reviews
router.get('/user/:userId', reviewController.getUserReviews);

// Update review
//router.put('/:id', validateReviewUpdate, validateRequest, reviewController.updateReview);

// Delete review
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
