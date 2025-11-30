const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const { sendPasswordResetEmail } = require('../services/email.service');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

/**
 * Sign up with email and password
 */
const signup = async (req, res) => {
    try {
        const { email, username, password, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase() },
                    ...(username ? [{ username }] : []),
                ],
            },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email.toLowerCase()
                    ? 'Email already registered'
                    : 'Username already taken',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                username: username || email.split('@')[0],
                password: hashedPassword,
                firstName,
                lastName,
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });

        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                token,
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
        });
    }
};

/**
 * Login with email and password
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated',
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
        });
    }
};

/**
 * Forgot password - Send reset email
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Token expires in 1 hour
        const resetExpires = new Date(Date.now() + 3600000);

        // Save hashed token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: hashedToken,
                passwordResetExpires: resetExpires
            }
        });

        // Send email with original token
        await sendPasswordResetEmail(user.email, resetToken, user.firstName || user.username);

        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request. Please try again.'
        });
    }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Hash the token to compare with database
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: {
                    gte: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired password reset token'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null
            }
        });

        res.json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password. Please try again.'
        });
    }
};

/**
 * Google OAuth callback success
 */
const googleCallback = async (req, res) => {
    try {
        // Generate token for authenticated user
        const token = generateToken(req.user.id);

        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/auth/failure`);
    }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
        });
    }
};

/**
 * Logout user
 */
const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed',
            });
        }
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    });
};

module.exports = {
    signup,
    login,
    forgotPassword,
    resetPassword,
    googleCallback,
    getProfile,
    logout,
};
