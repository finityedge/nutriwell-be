const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const categoryRoutes = require('./category.routes');
const collectionRoutes = require('./collection.routes');
const productRoutes = require('./product.routes');
const reviewRoutes = require('./review.routes');
const wishlistRoutes = require('./wishlist.routes');
const orderRoutes = require('./order.routes');
const dealRoutes = require('./deal.routes');

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running properly
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: NutriWell API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'NutriWell API is running',
        timestamp: new Date().toISOString(),
    });
});

/**
 * API Routes
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/collections', collectionRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/deals', dealRoutes);

/**
 * 404 handler for API routes
 */
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
    });
});

module.exports = router;
