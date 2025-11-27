const prisma = require('../config/database');

/**
 * Get all products (with pagination and filters)
 */
const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            categoryId,
            brand,
            minPrice,
            maxPrice,
            search,
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build where clause
        const where = {
            isActive: true,
            ...(categoryId && { categoryId }),
            ...(brand && { brand: { contains: brand, mode: 'insensitive' } }),
            ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
            ...(maxPrice && {
                price: { ...where.price, lte: parseFloat(maxPrice) },
            }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    brand: true,
                    price: true,
                    promoPrice: true,
                    quantity: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                        select: {
                            url: true,
                            altText: true,
                        },
                    },
                },
            }),
            prisma.product.count({ where }),
        ]);

        // Format response - return main image, name, prices, quantity, description
        const formattedProducts = products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            brand: product.brand,
            category: product.category,
            price: product.price,
            promoPrice: product.promoPrice,
            quantity: product.quantity,
            mainImage: product.images[0] || null,
        }));

        res.json({
            success: true,
            data: {
                products: formattedProducts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
        });
    }
};

/**
 * Get product by ID (with all details including reviews)
 */
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                images: {
                    orderBy: { displayOrder: 'asc' },
                },
                reviews: {
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
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Calculate average rating
        const averageRating =
            product.reviews.length > 0
                ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
                product.reviews.length
                : 0;

        res.json({
            success: true,
            data: {
                product: {
                    ...product,
                    averageRating: parseFloat(averageRating.toFixed(1)),
                    reviewCount: product.reviews.length,
                },
            },
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
        });
    }
};

/**
 * Create product (Admin only)
 */
const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            brand,
            categoryId,
            price,
            promoPrice,
            quantity,
            sku,
            tags,
            additionalInformation,
            images,
        } = req.body;

        // Check if SKU already exists
        const existingProduct = await prisma.product.findUnique({
            where: { sku },
        });

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SKU already exists',
            });
        }

        // Create product with images
        const product = await prisma.product.create({
            data: {
                name,
                description,
                brand,
                categoryId,
                price,
                promoPrice,
                quantity,
                sku,
                tags: tags || [],
                additionalInformation,
                images: {
                    create: images?.map((img, index) => ({
                        url: img.url,
                        altText: img.altText,
                        isPrimary: img.isPrimary || index === 0,
                        displayOrder: img.displayOrder || index,
                    })) || [],
                },
            },
            include: {
                images: true,
                category: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product },
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
        });
    }
};

/**
 * Update product (Admin only)
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            brand,
            categoryId,
            price,
            promoPrice,
            quantity,
            sku,
            tags,
            additionalInformation,
            isActive,
            images,
        } = req.body;

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // If updating SKU, check for duplicates
        if (sku && sku !== existingProduct.sku) {
            const duplicateProduct = await prisma.product.findUnique({
                where: { sku },
            });

            if (duplicateProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Product with this SKU already exists',
                });
            }
        }

        // Update product
        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(brand !== undefined && { brand }),
                ...(categoryId !== undefined && { categoryId }),
                ...(price && { price }),
                ...(promoPrice !== undefined && { promoPrice }),
                ...(quantity !== undefined && { quantity }),
                ...(sku && { sku }),
                ...(tags && { tags }),
                ...(additionalInformation !== undefined && { additionalInformation }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                images: true,
                category: true,
            },
        });

        // Handle images update if provided
        if (images) {
            // Delete existing images
            await prisma.productImage.deleteMany({
                where: { productId: id },
            });

            // Create new images
            await prisma.productImage.createMany({
                data: images.map((img, index) => ({
                    productId: id,
                    url: img.url,
                    altText: img.altText,
                    isPrimary: img.isPrimary || index === 0,
                    displayOrder: img.displayOrder || index,
                })),
            });
        }

        // Fetch updated product
        const updatedProduct = await prisma.product.findUnique({
            where: { id },
            include: {
                images: true,
                category: true,
            },
        });

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: { product: updatedProduct },
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
        });
    }
};

/**
 * Delete product (Admin only)
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Delete product (images and reviews will be cascaded)
        await prisma.product.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
