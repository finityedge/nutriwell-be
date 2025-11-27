const express = require('express');
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/product.controller');
const { verifyToken, hasRole } = require('../middleware/auth.middleware');
const {
    productValidation,
    validate,
} = require('../middleware/validation.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a paginated list of products with filters
 *     tags: [Products]
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
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand name (partial match)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve detailed product information including all images and reviews
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product
 *     description: Create a new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - quantity
 *               - sku
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Vitamin C 1000mg"
 *               description:
 *                 type: string
 *                 example: "High-quality vitamin C supplement"
 *               brand:
 *                 type: string
 *                 example: "Nature's Best"
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               price:
 *                 type: number
 *                 example: 29.99
 *               promoPrice:
 *                 type: number
 *                 example: 24.99
 *               quantity:
 *                 type: integer
 *                 example: 100
 *               sku:
 *                 type: string
 *                 example: "VIT-C-1000"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["vitamins", "supplements", "immunity"]
 *               additionalInformation:
 *                 type: string
 *                 example: "Take one tablet daily with food"
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     altText:
 *                       type: string
 *                     isPrimary:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
    '/',
    verifyToken,
    hasRole('ADMIN'),
    productValidation,
    validate,
    createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     description: Update an existing product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               brand:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               price:
 *                 type: number
 *               promoPrice:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               sku:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               additionalInformation:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     altText:
 *                       type: string
 *                     isPrimary:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put('/:id', verifyToken, hasRole('ADMIN'), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     description: Delete a product (Admin only)
 *     tags: [Products]
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
 *         description: Product deleted successfully
 */
router.delete('/:id', verifyToken, hasRole('ADMIN'), deleteProduct);

module.exports = router;
