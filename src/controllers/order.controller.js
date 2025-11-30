const prisma = require('../config/database');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../services/email.service');

/**
 * Generate unique order number
 */
function generateOrderNumber() {
    return Date.now().toString().slice(-7);
}

/**
 * Calculate shipping fee based on delivery method and region
 */
function calculateShippingFee(deliveryMethod, region) {
    if (deliveryMethod === 'STORE_PICKUP') {
        return 0;
    }

    // Customize shipping rates as needed
    const shippingRates = {
        'Sindh': 50,
        'Punjab': 100,
        'Balochistan': 150,
        'Khyber Pakhtunkhwa': 120,
        'default': 100
    };

    return shippingRates[region] || shippingRates.default;
}

/**
 * Create a new order
 */
const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            items,
            contactInfo,
            deliveryMethod,
            shippingInfo,
            paymentMethod,
            deliveryNote
        } = req.body;

        // Validation
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item'
            });
        }

        if (deliveryMethod === 'DELIVERY' && !shippingInfo) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address is required for delivery orders'
            });
        }

        // Fetch all products and validate
        const productIds = items.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                isActive: true
            }
        });

        if (products.length !== productIds.length) {
            const foundIds = products.map(p => p.id);
            const missingIds = productIds.filter(id => !foundIds.includes(id));
            return res.status(400).json({
                success: false,
                message: 'Some products not found or inactive',
                errors: missingIds.map(id => ({
                    productId: id,
                    error: 'Product not found or inactive'
                }))
            });
        }

        // Check stock availability and calculate totals
        const stockErrors = [];
        let subtotal = 0;

        const orderItems = items.map(item => {
            const product = products.find(p => p.id === item.productId);

            // Check stock
            if (product.quantity < item.quantity) {
                stockErrors.push({
                    productId: product.id,
                    productName: product.name,
                    requested: item.quantity,
                    available: product.quantity
                });
            }

            const itemSubtotal = parseFloat(product.price) * item.quantity;
            subtotal += itemSubtotal;

            return {
                productId: product.id,
                productName: product.name,
                productBrand: product.brand,
                quantity: item.quantity,
                price: product.price,
                subtotal: itemSubtotal
            };
        });

        if (stockErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some products have insufficient stock',
                errors: stockErrors
            });
        }

        // Calculate shipping and total
        const shippingFee = calculateShippingFee(deliveryMethod, shippingInfo?.region);
        const tax = 0; // Implement tax calculation if needed
        const total = subtotal + shippingFee + tax;

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order in transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    userId,
                    status: 'PENDING',
                    subtotal,
                    shippingFee,
                    tax,
                    total,
                    contactFirstName: contactInfo.firstName,
                    contactLastName: contactInfo.lastName,
                    contactPhone: contactInfo.phone,
                    contactEmail: contactInfo.email,
                    deliveryMethod,
                    shippingCountry: shippingInfo?.country,
                    shippingRegion: shippingInfo?.region,
                    shippingAddress: shippingInfo?.address,
                    shippingAddress2: shippingInfo?.address2,
                    deliveryDate: shippingInfo?.deliveryDate ? new Date(shippingInfo.deliveryDate) : null,
                    convenientTime: shippingInfo?.convenientTime,
                    paymentMethod,
                    deliveryNote,
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    brand: true,
                                    images: {
                                        where: { isPrimary: true },
                                        take: 1
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Deduct inventory
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            return newOrder;
        });

        // Send confirmation email asynchronously
        sendOrderConfirmationEmail(
            order.contactEmail,
            order,
            order.contactFirstName
        ).catch(err => console.error('Failed to send order confirmation email:', err));

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: { order }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
};

/**
 * Get user's orders (paginated)
 */
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, status } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            userId,
            ...(status && { status })
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    images: {
                                        where: { isPrimary: true },
                                        take: 1
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            prisma.order.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                brand: true,
                                images: {
                                    where: { isPrimary: true },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        if (!isAdmin && order.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order'
        });
    }
};

/**
 * Cancel order
 */
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { reason } = req.body;

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        if (order.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Check if order can be cancelled
        if (!['PENDING', 'PAID'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order with status: ${order.status}`
            });
        }

        // Cancel order and restore inventory
        const updatedOrder = await prisma.$transaction(async (tx) => {
            // Update order status
            const cancelled = await tx.order.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });

            // Restore inventory
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            increment: item.quantity
                        }
                    }
                });
            }

            return cancelled;
        });

        // Send cancellation email
        sendOrderStatusEmail(
            order.contactEmail,
            updatedOrder,
            order.contactFirstName
        ).catch(err => console.error('Failed to send order cancellation email:', err));

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: { order: updatedOrder }
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order'
        });
    }
};

/**
 * Update order status (Admin only)
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Validate status transition
        const allowedTransitions = {
            'PENDING': ['PAID', 'CANCELLED'],
            'PAID': ['PROCESSING', 'REFUNDED'],
            'PROCESSING': ['SHIPPED', 'CANCELLED'],
            'SHIPPED': ['DELIVERED'],
            'DELIVERED': [],
            'CANCELLED': [],
            'REFUNDED': []
        };

        const allowed = allowedTransitions[order.status] || [];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${order.status} to ${status}`
            });
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status }
        });

        // Send status update email
        sendOrderStatusEmail(
            order.contactEmail,
            updatedOrder,
            order.contactFirstName
        ).catch(err => console.error('Failed to send order status email:', err));

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: { order: updatedOrder }
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
};

/**
 * Get all orders (Admin only)
 */
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, userId, search } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            ...(status && { status }),
            ...(userId && { userId }),
            ...(search && {
                OR: [
                    { orderNumber: { contains: search } },
                    { contactEmail: { contains: search, mode: 'insensitive' } },
                    { contactPhone: { contains: search } }
                ]
            })
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.order.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    getAllOrders
};
