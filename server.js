const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/config');
const cron = require('node-cron');
const notificationService = require('./services/notificationService');

// Connect to MongoDB
connectDB();

// Schedule notifications (runs every day at 8 AM)
cron.schedule('0 8 * * *', () => {
  notificationService.sendScheduledNotifications();
});

// Start server
const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection:', err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});