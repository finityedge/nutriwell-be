require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

/**
 * Start server
 */
const server = app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log(`🌿 NutriWell API Server is running`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🚀 ========================================\n');
});

/**
 * Graceful shutdown
 */
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Closing server gracefully...`);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
