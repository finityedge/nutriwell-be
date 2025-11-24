const express = require('express');
const {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
} = require('../controllers/review.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const {
    reviewValidation,
    validate,
} = require('../middleware/validation.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Get product reviews
 *     description: Retrieve paginated reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/product/:productId', getProductReviews);

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   post:
 *     summary: Create product review
 *     description: Create a review for a product (one per user per product)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: User already reviewed this product
 */
router.post(
    '/product/:productId',
    verifyToken,
    reviewValidation,
    validate,
    createReview
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update review
 *     description: Update your own review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Can only edit own reviews
 */
router.put('/:id', verifyToken, reviewValidation, validate, updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     description: Delete your own review (or any review if admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: Can only delete own reviews
 */
router.delete('/:id', verifyToken, deleteReview);

module.exports = router;
