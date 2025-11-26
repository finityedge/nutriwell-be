const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all categories
 */
const getAllCategories = async (req, res) => {
    try {
        const { isActive, search } = req.query;

        const where = {};

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

        const categories = await prisma.category.findMany({
            where,
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
        });
    }
};

/**
 * Get category by ID
 */
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                products: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        promoPrice: true,
                        sku: true,
                    },
                },
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
        });
    }
};

/**
 * Create a new category
 * @access Admin only
 */
const createCategory = async (req, res) => {
    try {
        const { name, description, slug, isActive } = req.body;

        // Check if category with same name already exists
        const existingCategory = await prisma.category.findUnique({
            where: { name },
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists',
            });
        }

        const category = await prisma.category.create({
            data: {
                name,
                description,
                slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category,
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating category',
        });
    }
};

/**
 * Update a category
 * @access Admin only
 */
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, slug, isActive } = req.body;

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id },
        });

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        // Check if new name conflicts with another category
        if (name && name !== existingCategory.name) {
            const duplicateCategory = await prisma.category.findUnique({
                where: { name },
            });

            if (duplicateCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category with this name already exists',
                });
            }
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(slug && { slug }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating category',
        });
    }
};

/**
 * Delete a category
 * @access Admin only
 */
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        // Delete the category (products will have categoryId set to null due to onDelete: SetNull)
        await prisma.category.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
