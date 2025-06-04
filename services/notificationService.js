const Task = require('../models/Task');
const User = require('../models/User');
const crypto = require('crypto');
const config = require('../config/config');

/**
 * Send scheduled notifications for upcoming tasks
 * This is called by the cron job in server.js
 */
exports.sendScheduledNotifications = async () => {
  try {
    console.log('Running scheduled notifications check...');
    
    // Get all tasks scheduled for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const tasks = await Task.find({
      scheduledDate: {
        $gte: tomorrow,
        $lt: nextDay
      },
      status: 'pending',
      reminderSent: false
    });
    
    console.log(`Found ${tasks.length} tasks scheduled for tomorrow`);
    
    // Group tasks by user
    const tasksByUser = {};
    
    for (const task of tasks) {
      if (!tasksByUser[task.userId]) {
        tasksByUser[task.userId] = [];
      }
      tasksByUser[task.userId].push(task);
    }
    
    // Send notifications to each user
    for (const userId in tasksByUser) {
      const user = await User.findById(userId);
      
      if (!user || !user.consentGiven) {
        console.log(`Skipping notifications for user ${userId} - no consent given`);
        continue;
      }
      
      // In a real app, you would send SMS or push notifications here
      console.log(`Sending notification to ${user.name} about ${tasksByUser[userId].length} tasks`);
      
      // For demonstration, we'll just log the tasks
      for (const task of tasksByUser[userId]) {
        console.log(`- Task: ${task.title} scheduled for ${task.scheduledDate}`);
        
        // Mark reminder as sent
        await Task.findByIdAndUpdate(task._id, {
          reminderSent: true
        });
      }
      
      // If user has phone number, send SMS (simulated)
      if (user.phone) {
        // Decrypt phone number
        const decipher = crypto.createDecipher('aes-256-cbc', config.encryptionKey);
        let decryptedPhone = decipher.update(user.phone, 'hex', 'utf8');
        decryptedPhone += decipher.final('utf8');
        
        console.log(`Would send SMS to ${decryptedPhone} with task reminders`);
      }
    }
    
    console.log('Scheduled notifications completed');
  } catch (error) {
    console.error('Error sending scheduled notifications:', error);
  }
};

/**
 * Send immediate notification for a specific task
 * This can be called when a task is assigned or modified
 */
exports.sendTaskNotification = async (taskId, notificationType) => {
  try {
    const task = await Task.findById(taskId);
    
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }
    
    const user = await User.findById(task.userId);
    
    if (!user || !user.consentGiven) {
      console.log(`Skipping notification for user ${task.userId} - no consent given`);
      return;
    }
    
    // In a real app, you would send SMS or push notifications here
    console.log(`Sending ${notificationType} notification to ${user.name} for task: ${task.title}`);
    
    // If user has phone number, send SMS (simulated)
    if (user.phone) {
      // Decrypt phone number
      const decipher = crypto.createDecipher('aes-256-cbc', config.encryptionKey);
      let decryptedPhone = decipher.update(user.phone, 'hex', 'utf8');
      decryptedPhone += decipher.final('utf8');
      
      console.log(`Would send SMS to ${decryptedPhone} about task: ${task.title}`);
    }
  } catch (error) {
    console.error('Error sending task notification:', error);
  }
};