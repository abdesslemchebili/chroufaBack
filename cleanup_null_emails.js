const mongoose = require('mongoose');
const config = require('./config/config');

async function cleanupNullEmails() {
  try {
    console.log('🧹 Cleaning up null email values...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Step 1: Find all users with null email
    console.log('1. Finding users with null email...');
    const usersWithNullEmail = await collection.find({ email: null }).toArray();
    console.log(`Found ${usersWithNullEmail.length} users with null email`);

    if (usersWithNullEmail.length === 0) {
      console.log('✅ No users with null email found. Nothing to clean up.');
      return;
    }

    // Step 2: Display users that will be updated
    console.log('\n2. Users with null email:');
    usersWithNullEmail.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Username: ${user.username}, Name: ${user.name}`);
    });

    // Step 3: Ask for confirmation
    console.log('\n3. Options:');
    console.log('a) Generate unique temporary emails (recommended)');
    console.log('b) Remove email field entirely');
    console.log('c) Skip cleanup');
    
    // For automation, we'll use option a
    const option = 'a';
    console.log(`Selected option: ${option}`);

    if (option === 'a') {
      // Generate unique temporary emails
      console.log('\n4. Generating unique temporary emails...');
      
      for (let i = 0; i < usersWithNullEmail.length; i++) {
        const user = usersWithNullEmail[i];
        const tempEmail = `temp_${user.username}_${Date.now()}_${i}@temp.local`;
        
        await collection.updateOne(
          { _id: user._id },
          { $set: { email: tempEmail } }
        );
        
        console.log(`✅ Updated user ${user.username}: ${tempEmail}`);
      }
      
      console.log('\n✅ All null emails replaced with temporary unique emails');
      console.log('📝 Note: Users should update their email addresses later');
      
    } else if (option === 'b') {
      // Remove email field entirely
      console.log('\n4. Removing email field from users with null email...');
      
      for (const user of usersWithNullEmail) {
        await collection.updateOne(
          { _id: user._id },
          { $unset: { email: "" } }
        );
        
        console.log(`✅ Removed email field from user ${user.username}`);
      }
      
      console.log('\n✅ Email field removed from all users with null email');
      
    } else {
      console.log('\n⏭️  Skipping cleanup');
      return;
    }

    // Step 4: Verify the fix
    console.log('\n5. Verifying the fix...');
    const remainingNullEmails = await collection.find({ email: null }).toArray();
    console.log(`Users with null email after cleanup: ${remainingNullEmails.length}`);

    if (remainingNullEmails.length === 0) {
      console.log('✅ No users with null email remaining');
    } else {
      console.log('⚠️  Some users still have null email:');
      remainingNullEmails.forEach(user => {
        console.log(`- ${user.username} (${user.name})`);
      });
    }

    // Step 5: Test unique constraint
    console.log('\n6. Testing unique email constraint...');
    const duplicateEmails = await collection.aggregate([
      { $group: { _id: "$email", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicateEmails.length === 0) {
      console.log('✅ No duplicate emails found');
    } else {
      console.log('⚠️  Found duplicate emails:');
      duplicateEmails.forEach(dup => {
        console.log(`- Email: ${dup._id}, Count: ${dup.count}`);
      });
    }

    console.log('\n🎉 Email cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during email cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupNullEmails();
}

module.exports = { cleanupNullEmails }; 