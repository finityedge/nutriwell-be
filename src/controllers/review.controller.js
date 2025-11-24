const prisma = require('../config/database');

/**
 * Get reviews for a product
 */
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { productId },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
            }),
            prisma.review.count({ where: { productId } }),
        ]);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
        });
    }
};

/**
 * Create review for a product
 */
const createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Check if user already reviewed this product
        const existingReview = await prisma.review.findUnique({
            where: {
                productId_userId: {
                    productId,
                    userId,
                },
            },
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product',
            });
        }

        // Create review
        const review = await prisma.review.create({
            data: {
                productId,
                userId,
                rating,
                comment,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: { review },
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create review',
        });
    }
};

/**
 * Update review
 */
const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        // Check if review exists
        const existingReview = await prisma.review.findUnique({
            where: { id },
        });

        if (!existingReview) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }

        // Check if user owns the review
        if (existingReview.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own reviews',
            });
        }

        // Update review
        const review = await prisma.review.update({
            where: { id },
            data: {
                ...(rating !== undefined && { rating }),
                ...(comment !== undefined && { comment }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: { review },
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
        });
    }
};

/**
 * Delete review
 */
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if review exists
        const review = await prisma.review.findUnique({
            where: { id },
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }

        // Check if user owns the review or is admin
        if (review.userId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews',
            });
        }

        // Delete review
        await prisma.review.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Review deleted successfully',
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
        });
    }
};

module.exports = {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
};
