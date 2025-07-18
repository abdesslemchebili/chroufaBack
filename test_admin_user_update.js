const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let testUserId = '';

// Test data
const adminUser = {
  name: 'Admin Test',
  username: 'admintest',
  email: 'admin@test.com',
  password: 'admin123',
  role: 'admin',
  consentGiven: true
};

const testUser = {
  name: 'Test User',
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'password123',
  role: 'user',
  phone: '+1234567890',
  consentGiven: false
};

const updatedUserData = {
  name: 'Updated Test User',
  username: 'updatedtestuser',
  email: 'updated@example.com',
  role: 'admin',
  phone: '+0987654321',
  consentGiven: true
};

// Helper functions
async function createUser(userData) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    return response.data.data._id;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error;
  }
}

async function loginUser(username, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error('Error logging in:', error.response?.data || error.message);
    throw error;
  }
}

async function createUserAsAdmin(userData, token) {
  try {
    const response = await axios.post(`${BASE_URL}/admin/users`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.user.id;
  } catch (error) {
    console.error('Error creating user as admin:', error.response?.data || error.message);
    throw error;
  }
}

async function updateUserAsAdmin(userId, updateData, token) {
  try {
    const response = await axios.put(`${BASE_URL}/admin/users/${userId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user as admin:', error.response?.data || error.message);
    throw error;
  }
}

async function getUserAsAdmin(userId, token) {
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.users.find(user => user._id === userId);
  } catch (error) {
    console.error('Error getting user as admin:', error.response?.data || error.message);
    throw error;
  }
}

async function deleteUserAsAdmin(userId, token) {
  try {
    const response = await axios.delete(`${BASE_URL}/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting user as admin:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function testAdminUserUpdate() {
  console.log('🧪 Starting admin user update test...\n');

  try {
    // Step 1: Create admin user
    console.log('1. Creating admin user...');
    const adminId = await createUser(adminUser);
    console.log(`✅ Admin user created with ID: ${adminId}\n`);

    // Step 2: Login as admin
    console.log('2. Logging in as admin...');
    adminToken = await loginUser(adminUser.username, adminUser.password);
    console.log('✅ Logged in as admin successfully\n');

    // Step 3: Create test user as admin
    console.log('3. Creating test user as admin...');
    testUserId = await createUserAsAdmin(testUser, adminToken);
    console.log(`✅ Test user created with ID: ${testUserId}\n`);

    // Step 4: Verify initial user data
    console.log('4. Verifying initial user data...');
    const initialUser = await getUserAsAdmin(testUserId, adminToken);
    console.log('✅ Initial user data:', {
      name: initialUser.name,
      username: initialUser.username,
      email: initialUser.email,
      role: initialUser.role,
      phone: initialUser.phone,
      consentGiven: initialUser.consentGiven
    });

    if (initialUser.name !== testUser.name || initialUser.role !== testUser.role) {
      throw new Error('Initial user data verification failed');
    }
    console.log('✅ Initial user data verified correctly\n');

    // Step 5: Update user as admin
    console.log('5. Updating user as admin...');
    const updateResult = await updateUserAsAdmin(testUserId, updatedUserData, adminToken);
    console.log('✅ User update request completed');
    console.log('✅ Update result:', updateResult.message);

    // Step 6: Verify the changes
    console.log('\n6. Verifying user changes...');
    const updatedUser = await getUserAsAdmin(testUserId, adminToken);
    console.log('✅ Updated user data:', {
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      consentGiven: updatedUser.consentGiven
    });

    // Verify all fields were updated correctly
    if (updatedUser.name !== updatedUserData.name) {
      throw new Error('Name was not updated correctly');
    }
    if (updatedUser.username !== updatedUserData.username) {
      throw new Error('Username was not updated correctly');
    }
    if (updatedUser.email !== updatedUserData.email) {
      throw new Error('Email was not updated correctly');
    }
    if (updatedUser.role !== updatedUserData.role) {
      throw new Error('Role was not updated correctly');
    }
    if (updatedUser.phone !== updatedUserData.phone) {
      throw new Error('Phone was not updated correctly');
    }
    if (updatedUser.consentGiven !== updatedUserData.consentGiven) {
      throw new Error('Consent was not updated correctly');
    }
    console.log('✅ All user fields updated correctly\n');

    // Step 7: Test partial update
    console.log('7. Testing partial update...');
    const partialUpdateData = {
      name: 'Partially Updated User',
      role: 'user'
    };
    
    const partialUpdateResult = await updateUserAsAdmin(testUserId, partialUpdateData, adminToken);
    console.log('✅ Partial update completed');
    
    const partiallyUpdatedUser = await getUserAsAdmin(testUserId, adminToken);
    console.log('✅ Partially updated user data:', {
      name: partiallyUpdatedUser.name,
      role: partiallyUpdatedUser.role,
      username: partiallyUpdatedUser.username // Should remain unchanged
    });

    if (partiallyUpdatedUser.name !== partialUpdateData.name) {
      throw new Error('Partial update name verification failed');
    }
    if (partiallyUpdatedUser.role !== partialUpdateData.role) {
      throw new Error('Partial update role verification failed');
    }
    if (partiallyUpdatedUser.username !== updatedUserData.username) {
      throw new Error('Partial update should not change other fields');
    }
    console.log('✅ Partial update verified correctly\n');

    // Step 8: Test with invalid user ID
    console.log('8. Testing with invalid user ID...');
    try {
      await updateUserAsAdmin('507f1f77bcf86cd799439011', updatedUserData, adminToken); // Invalid MongoDB ID
      throw new Error('Should have failed with invalid user ID');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly rejected invalid user ID');
      } else {
        throw error;
      }
    }

    // Step 9: Test username conflict
    console.log('\n9. Testing username conflict...');
    try {
      await updateUserAsAdmin(testUserId, { username: adminUser.username }, adminToken);
      throw new Error('Should have failed with username conflict');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('username already exists')) {
        console.log('✅ Correctly rejected username conflict');
      } else {
        throw error;
      }
    }

    // Step 10: Clean up - delete test user
    console.log('\n10. Cleaning up test user...');
    await deleteUserAsAdmin(testUserId, adminToken);
    console.log('✅ Test user deleted successfully');

    console.log('\n🎉 All tests passed! Admin user update functionality is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testAdminUserUpdate();
}

module.exports = { testAdminUserUpdate }; 