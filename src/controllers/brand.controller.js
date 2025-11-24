const prisma = require('../config/database');

/**
 * Get all brands
 */
const getAllBrands = async (req, res) => {
    try {
        const { active } = req.query;

        const brands = await prisma.brand.findMany({
            where: active !== undefined ? { isActive: active === 'true' } : {},
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        res.json({
            success: true,
            data: { brands },
        });
    } catch (error) {
        console.error('Get brands error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch brands',
        });
    }
};

/**
 * Get brand by ID
 */
const getBrandById = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await prisma.brand.findUnique({
            where: { id },
            include: {
                products: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found',
            });
        }

        res.json({
            success: true,
            data: { brand },
        });
    } catch (error) {
        console.error('Get brand error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch brand',
        });
    }
};

/**
 * Create brand (Admin only)
 */
const createBrand = async (req, res) => {
    try {
        const { name, description, logo } = req.body;

        // Check if brand already exists
        const existingBrand = await prisma.brand.findUnique({
            where: { name },
        });

        if (existingBrand) {
            return res.status(400).json({
                success: false,
                message: 'Brand with this name already exists',
            });
        }

        const brand = await prisma.brand.create({
            data: {
                name,
                description,
                logo,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Brand created successfully',
            data: { brand },
        });
    } catch (error) {
        console.error('Create brand error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create brand',
        });
    }
};

/**
 * Update brand (Admin only)
 */
const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, logo, isActive } = req.body;

        // Check if brand exists
        const existingBrand = await prisma.brand.findUnique({
            where: { id },
        });

        if (!existingBrand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found',
            });
        }

        // If updating name, check for duplicates
        if (name && name !== existingBrand.name) {
            const duplicateBrand = await prisma.brand.findUnique({
                where: { name },
            });

            if (duplicateBrand) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand with this name already exists',
                });
            }
        }

        const brand = await prisma.brand.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(logo !== undefined && { logo }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json({
            success: true,
            message: 'Brand updated successfully',
            data: { brand },
        });
    } catch (error) {
        console.error('Update brand error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update brand',
        });
    }
};

/**
 * Delete brand (Admin only)
 */
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if brand exists
        const brand = await prisma.brand.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found',
            });
        }

        // Check if brand has products
        if (brand._count.products > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete brand with associated products',
            });
        }

        await prisma.brand.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Brand deleted successfully',
        });
    } catch (error) {
        console.error('Delete brand error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete brand',
        });
    }
};

module.exports = {
    getAllBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
};
