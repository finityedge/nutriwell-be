const express = require('express');
const {
    getProfile,
    updateProfile,
    changePassword
} = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management endpoints
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyToken, getProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: uri
 *               gender:
 *                 type: string
 *               country:
 *                 type: string
 *               language:
 *                 type: string
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
    '/me',
    verifyToken,
    [
        body('username')
            .optional()
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3 and 30 characters'),
        body('firstName')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('First name must be between 1 and 50 characters'),
        body('lastName')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Last name must be between 1 and 50 characters'),
        body('avatar')
            .optional()
            .trim()
            .isURL()
            .withMessage('Avatar must be a valid URL'),
        body('gender')
            .optional()
            .trim(),
        body('country')
            .optional()
            .trim(),
        body('language')
            .optional()
            .trim()
            .isLength({ min: 2, max: 5 })
            .withMessage('Language code must be 2-5 characters'),
        body('timezone')
            .optional()
            .trim(),
        handleValidationErrors
    ],
    updateProfile
);

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Change password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or incorrect password
 *       401:
 *         description: Unauthorized
 */
router.put(
    '/me/password',
    verifyToken,
    [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('New password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        handleValidationErrors
    ],
    changePassword
);

module.exports = router;
