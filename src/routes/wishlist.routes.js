const express = require('express');
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist,
    clearWishlist,
} = require('../controllers/wishlist.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     description: Retrieve the authenticated user's wishlist with product details
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, getWishlist);

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   post:
 *     summary: Add product to wishlist
 *     description: Add a product to the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       201:
 *         description: Product added to wishlist
 *       400:
 *         description: Product already in wishlist
 *       404:
 *         description: Product not found
 */
router.post('/:productId', verifyToken, addToWishlist);

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     description: Remove a product from the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *       404:
 *         description: Product not in wishlist
 */
router.delete('/:productId', verifyToken, removeFromWishlist);

/**
 * @swagger
 * /api/wishlist/check/{productId}:
 *   get:
 *     summary: Check if product is in wishlist
 *     description: Check if a specific product is in the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     inWishlist:
 *                       type: boolean
 */
router.get('/check/:productId', verifyToken, checkWishlist);

/**
 * @swagger
 * /api/wishlist/clear:
 *   delete:
 *     summary: Clear entire wishlist
 *     description: Remove all products from the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 */
router.delete('/clear/all', verifyToken, clearWishlist);

module.exports = router;
