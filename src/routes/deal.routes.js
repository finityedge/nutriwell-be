const express = require('express');
const {
    setProductDeal,
    removeProductDeal,
    getActiveDeals
} = require('../controllers/deal.controller');
const { verifyToken, hasRole } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Deals
 *   description: Product deals management endpoints
 */

/**
 * @swagger
 * /api/deals/active:
 *   get:
 *     summary: Get active deals
 *     tags: [Deals]
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
 *       - in: query
 *         name: collectionId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Active deals retrieved successfully
 */
router.get('/active', getActiveDeals);

/**
 * @swagger
 * /api/deals/products/{id}:
 *   post:
 *     summary: Set product on deal (Admin only)
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealStartDate
 *               - dealEndDate
 *             properties:
 *               dealStartDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the deal starts
 *               dealEndDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the deal ends
 *     responses:
 *       200:
 *         description: Deal set successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
    '/products/:id',
    verifyToken,
    hasRole('ADMIN'),
    [
        body('dealStartDate')
            .notEmpty()
            .withMessage('Deal start date is required')
            .isISO8601()
            .withMessage('Invalid date format'),
        body('dealEndDate')
            .notEmpty()
            .withMessage('Deal end date is required')
            .isISO8601()
            .withMessage('Invalid date format'),
        validate
    ],
    setProductDeal
);

/**
 * @swagger
 * /api/deals/products/{id}:
 *   delete:
 *     summary: Remove product from deal (Admin only)
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product removed from deal
 *       404:
 *         description: Product not found
 *       403:
 *         description: Forbidden - Admin only
 */
router.delete(
    '/products/:id',
    verifyToken,
    hasRole('ADMIN'),
    removeProductDeal
);

module.exports = router;
