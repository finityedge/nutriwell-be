const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NutriWell E-commerce API',
            version: '1.0.0',
            description: '🌿 A comprehensive API for the NutriWell nutrition and wellness e-commerce platform',
            contact: {
                name: 'NutriWell Support',
                email: 'support@nutriwell.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
            {
                url: 'https://api.nutriwell.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Unique user identifier',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        username: {
                            type: 'string',
                            description: 'User username',
                        },
                        firstName: {
                            type: 'string',
                            description: 'User first name',
                        },
                        lastName: {
                            type: 'string',
                            description: 'User last name',
                        },
                        avatar: {
                            type: 'string',
                            format: 'uri',
                            description: 'User avatar URL',
                        },
                        role: {
                            type: 'string',
                            enum: ['CUSTOMER', 'ADMIN', 'VENDOR'],
                            description: 'User role',
                        },
                        isVerified: {
                            type: 'boolean',
                            description: 'Whether email is verified',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                SignupRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@nutriwell.com',
                        },
                        username: {
                            type: 'string',
                            minLength: 3,
                            maxLength: 30,
                            example: 'johndoe',
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                            example: 'SecurePass123',
                            description: 'Must contain at least one uppercase, one lowercase, and one number',
                        },
                        firstName: {
                            type: 'string',
                            example: 'John',
                        },
                        lastName: {
                            type: 'string',
                            example: 'Doe',
                        },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@nutriwell.com',
                        },
                        password: {
                            type: 'string',
                            example: 'SecurePass123',
                        },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                        },
                        message: {
                            type: 'string',
                            example: 'Login successful',
                        },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    $ref: '#/components/schemas/User',
                                },
                                token: {
                                    type: 'string',
                                    description: 'JWT authentication token',
                                },
                            },
                        },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            example: 'Error message',
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                    },
                                    message: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                },
                Brand: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        name: {
                            type: 'string',
                        },
                        description: {
                            type: 'string',
                        },
                        logo: {
                            type: 'string',
                            format: 'uri',
                        },
                        isActive: {
                            type: 'boolean',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Product: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        name: {
                            type: 'string',
                        },
                        description: {
                            type: 'string',
                        },
                        category: {
                            type: 'string',
                        },
                        price: {
                            type: 'number',
                        },
                        promoPrice: {
                            type: 'number',
                        },
                        quantity: {
                            type: 'integer',
                        },
                        sku: {
                            type: 'string',
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                        },
                        additionalInformation: {
                            type: 'string',
                        },
                        isActive: {
                            type: 'boolean',
                        },
                        brandId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Review: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        rating: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 5,
                        },
                        comment: {
                            type: 'string',
                        },
                        productId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        userId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Authentication',
                description: 'Authentication and user management endpoints',
            },
            {
                name: 'Brands',
                description: 'Brand management endpoints',
            },
            {
                name: 'Products',
                description: 'Product management endpoints',
            },
            {
                name: 'Reviews',
                description: 'Product review endpoints',
            },
            {
                name: 'Wishlist',
                description: 'User wishlist management endpoints',
            },
            {
                name: 'Health',
                description: 'API health check endpoints',
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
