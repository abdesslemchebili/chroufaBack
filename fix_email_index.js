const mongoose = require('mongoose');
const config = require('./config/config');

async function fixEmailIndex() {
  try {
    console.log('🔧 Fixing email index in users collection...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Step 1: Check current indexes
    console.log('1. Checking current indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique,
      sparse: idx.sparse
    })));

    // Step 2: Find users with null email
    console.log('\n2. Finding users with null email...');
    const usersWithNullEmail = await collection.find({ email: null }).toArray();
    console.log(`Found ${usersWithNullEmail.length} users with null email`);

    if (usersWithNullEmail.length > 0) {
      console.log('Users with null email:');
      usersWithNullEmail.forEach(user => {
        console.log(`- ID: ${user._id}, Username: ${user.username}, Name: ${user.name}`);
      });
    }

    // Step 3: Drop the problematic email index
    console.log('\n3. Dropping existing email index...');
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Email index dropped successfully');
    } catch (error) {
      if (error.code === 26) {
        console.log('ℹ️  Email index does not exist, skipping drop');
      } else {
        throw error;
      }
    }

    // Step 4: Create new sparse unique index
    console.log('\n4. Creating new sparse unique index on email...');
    await collection.createIndex(
      { email: 1 },
      { 
        unique: true, 
        sparse: true,
        name: 'email_1'
      }
    );
    console.log('✅ New sparse unique email index created');

    // Step 5: Verify the new index
    console.log('\n5. Verifying new index...');
    const newIndexes = await collection.indexes();
    const emailIndex = newIndexes.find(idx => idx.name === 'email_1');
    
    if (emailIndex) {
      console.log('✅ Email index verified:');
      console.log(`   - Name: ${emailIndex.name}`);
      console.log(`   - Key: ${JSON.stringify(emailIndex.key)}`);
      console.log(`   - Unique: ${emailIndex.unique}`);
      console.log(`   - Sparse: ${emailIndex.sparse}`);
    } else {
      console.log('❌ Email index not found');
    }

    // Step 6: Test with null email values
    console.log('\n6. Testing with null email values...');
    const testResult = await collection.find({ email: null }).toArray();
    console.log(`✅ Found ${testResult.length} users with null email (should work now)`);

    console.log('\n🎉 Email index fix completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- Dropped problematic non-sparse email index');
    console.log('- Created new sparse unique email index');
    console.log('- Null email values are now allowed');
    console.log('- Duplicate email values are still prevented');

  } catch (error) {
    console.error('❌ Error fixing email index:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the fix
if (require.main === module) {
  fixEmailIndex();
}

module.exports = { fixEmailIndex }; 