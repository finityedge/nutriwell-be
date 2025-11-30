const prisma = require('../config/database');

/**
 * Set product on deal (Admin only)
 */
const setProductDeal = async (req, res) => {
    try {
        const { id } = req.params;
        const { dealStartDate, dealEndDate } = req.body;

        // Validate dates
        const startDate = new Date(dealStartDate);
        const endDate = new Date(dealEndDate);
        const now = new Date();

        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: 'Deal end date must be after start date'
            });
        }

        if (endDate <= now) {
            return res.status(400).json({
                success: false,
                message: 'Deal end date must be in the future'
            });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update product with deal
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                isOnDeal: true,
                dealStartDate: startDate,
                dealEndDate: endDate
            },
            include: {
                images: true,
                collection: {
                    include: {
                        category: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Product deal set successfully',
            data: { product: updatedProduct }
        });

    } catch (error) {
        console.error('Set product deal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set product deal'
        });
    }
};

/**
 * Remove product from deal (Admin only)
 */
const removeProductDeal = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                isOnDeal: false,
                dealStartDate: null,
                dealEndDate: null
            }
        });

        res.json({
            success: true,
            message: 'Product removed from deal',
            data: { product: updatedProduct }
        });

    } catch (error) {
        console.error('Remove product deal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove product deal'
        });
    }
};

/**
 * Get active deals (paginated)
 */
const getActiveDeals = async (req, res) => {
    try {
        const { page = 1, limit = 20, collectionId, categoryId } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const now = new Date();

        // Build where clause
        const where = {
            isActive: true,
            isOnDeal: true,
            dealStartDate: { lte: now },
            dealEndDate: { gte: now },
            ...(collectionId && { collectionId }),
            ...(categoryId && {
                collection: {
                    categoryId
                }
            })
        };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take,
                orderBy: { dealEndDate: 'asc' }, // Show deals ending soonest first
                include: {
                    images: {
                        where: { isPrimary: true },
                        take: 1
                    },
                    collection: {
                        include: {
                            category: true
                        }
                    },
                    reviews: {
                        select: {
                            rating: true
                        }
                    }
                }
            }),
            prisma.product.count({ where })
        ]);

        // Calculate average rating and add deal info for each product
        const productsWithDeals = products.map(product => {
            const avgRating = product.reviews.length > 0
                ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                : 0;

            // Calculate discount percentage
            let discountPercentage = 0;
            if (product.promoPrice && product.price) {
                discountPercentage = Math.round(
                    ((parseFloat(product.price) - parseFloat(product.promoPrice)) / parseFloat(product.price)) * 100
                );
            }

            return {
                ...product,
                averageRating: avgRating,
                reviewCount: product.reviews.length,
                discountPercentage,
                reviews: undefined // Remove reviews array from response
            };
        });

        res.json({
            success: true,
            data: {
                products: productsWithDeals,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get active deals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active deals'
        });
    }
};

module.exports = {
    setProductDeal,
    removeProductDeal,
    getActiveDeals
};
