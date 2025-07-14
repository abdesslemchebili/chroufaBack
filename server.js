const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/config');
const cron = require('node-cron');
const notificationService = require('./services/notificationService');
const appointmentService = require('./services/appointmentService');

// Connect to MongoDB
connectDB();

// Schedule notifications (runs every day at 8 AM)
cron.schedule('0 8 * * *', () => {
  notificationService.sendScheduledNotifications();
});

// Schedule appointment visit generation (runs every day at 6 AM)
cron.schedule('0 6 * * *', () => {
  appointmentService.generateUpcomingVisits();
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