const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                gender: true,
                country: true,
                language: true,
                timezone: true,
                isVerified: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            username,
            firstName,
            lastName,
            avatar,
            gender,
            country,
            language,
            timezone
        } = req.body;

        // Check if username is taken (if provided and different)
        if (username) {
            const existingUser = await prisma.user.findUnique({
                where: { username }
            });

            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Username is already taken'
                });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(username !== undefined && { username }),
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(avatar !== undefined && { avatar }),
                ...(gender !== undefined && { gender }),
                ...(country !== undefined && { country }),
                ...(language !== undefined && { language }),
                ...(timezone !== undefined && { timezone })
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                gender: true,
                country: true,
                language: true,
                timezone: true,
                isVerified: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || !user.password) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change password for OAuth users'
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};
