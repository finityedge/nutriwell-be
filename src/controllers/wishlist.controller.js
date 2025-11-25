const prisma = require('../config/database');

/**
 * Get user's wishlist
 */
const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [wishlistItems, total] = await Promise.all([
            prisma.wishlist.findMany({
                where: { userId },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: {
                        include: {
                            images: {
                                where: { isPrimary: true },
                                take: 1,
                            },
                            brand: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.wishlist.count({ where: { userId } }),
        ]);

        res.json({
            success: true,
            data: {
                wishlist: wishlistItems,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wishlist',
        });
    }
};

/**
 * Add product to wishlist
 */
const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

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

        // Check if already in wishlist
        const existingItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist',
            });
        }

        // Add to wishlist
        const wishlistItem = await prisma.wishlist.create({
            data: {
                userId,
                productId,
            },
            include: {
                product: {
                    include: {
                        images: {
                            where: { isPrimary: true },
                            take: 1,
                        },
                        brand: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Product added to wishlist',
            data: { wishlistItem },
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add product to wishlist',
        });
    }
};

/**
 * Remove product from wishlist
 */
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        // Check if item exists in wishlist
        const wishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (!wishlistItem) {
            return res.status(404).json({
                success: false,
                message: 'Product not in wishlist',
            });
        }

        // Remove from wishlist
        await prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        res.json({
            success: true,
            message: 'Product removed from wishlist',
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove product from wishlist',
        });
    }
};

/**
 * Check if product is in wishlist
 */
const checkWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const wishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        res.json({
            success: true,
            data: {
                inWishlist: !!wishlistItem,
            },
        });
    } catch (error) {
        console.error('Check wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check wishlist',
        });
    }
};

/**
 * Clear entire wishlist
 */
const clearWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.wishlist.deleteMany({
            where: { userId },
        });

        res.json({
            success: true,
            message: 'Wishlist cleared successfully',
        });
    } catch (error) {
        console.error('Clear wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear wishlist',
        });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist,
    clearWishlist,
};
