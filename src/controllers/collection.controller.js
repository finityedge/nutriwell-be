const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all collections
 */
const getAllCollections = async (req, res) => {
    try {
        const { categoryId, isActive, search } = req.query;

        const where = {};

        // Filter by category
        if (categoryId) {
            where.categoryId = categoryId;
        }

        // Filter by active status
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        // Search by name or description
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const collections = await prisma.collection.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: collections,
        });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching collections',
        });
    }
};

/**
 * Get collection by ID
 */
const getCollectionById = async (req, res) => {
    try {
        const { id } = req.params;

        const collection = await prisma.collection.findUnique({
            where: { id },
            include: {
                category: true,
                products: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        brand: true,
                        price: true,
                        promoPrice: true,
                        sku: true,
                    },
                },
            },
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found',
            });
        }

        res.json({
            success: true,
            data: collection,
        });
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching collection',
        });
    }
};

/**
 * Get collections by category
 */
const getCollectionsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const collections = await prisma.collection.findMany({
            where: { categoryId },
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: collections,
        });
    } catch (error) {
        console.error('Error fetching collections by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching collections',
        });
    }
};

/**
 * Create a new collection
 * @access Admin only
 */
const createCollection = async (req, res) => {
    try {
        const { name, description, slug, categoryId, isActive } = req.body;

        // Check if collection with same slug already exists
        const existingCollection = await prisma.collection.findUnique({
            where: { slug },
        });

        if (existingCollection) {
            return res.status(400).json({
                success: false,
                message: 'Collection with this slug already exists',
            });
        }

        const collection = await prisma.collection.create({
            data: {
                name,
                description,
                slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
                categoryId,
                isActive: isActive !== undefined ? isActive : true,
            },
            include: {
                category: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Collection created successfully',
            data: collection,
        });
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating collection',
        });
    }
};

/**
 * Update a collection
 * @access Admin only
 */
const updateCollection = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, slug, categoryId, isActive } = req.body;

        // Check if collection exists
        const existingCollection = await prisma.collection.findUnique({
            where: { id },
        });

        if (!existingCollection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found',
            });
        }

        // Check if new slug conflicts with another collection
        if (slug && slug !== existingCollection.slug) {
            const duplicateCollection = await prisma.collection.findUnique({
                where: { slug },
            });

            if (duplicateCollection) {
                return res.status(400).json({
                    success: false,
                    message: 'Collection with this slug already exists',
                });
            }
        }

        const collection = await prisma.collection.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(slug && { slug }),
                ...(categoryId && { categoryId }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                category: true,
            },
        });

        res.json({
            success: true,
            message: 'Collection updated successfully',
            data: collection,
        });
    } catch (error) {
        console.error('Error updating collection:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating collection',
        });
    }
};

/**
 * Delete a collection
 * @access Admin only
 */
const deleteCollection = async (req, res) => {
    try {
        const { id } = req.params;

        const collection = await prisma.collection.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found',
            });
        }

        // Delete the collection (products will have collectionId set to null due to onDelete: SetNull)
        await prisma.collection.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Collection deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting collection:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting collection',
        });
    }
};

module.exports = {
    getAllCollections,
    getCollectionById,
    getCollectionsByCategory,
    createCollection,
    updateCollection,
    deleteCollection,
};
