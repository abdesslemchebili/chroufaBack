const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let poolId = '';
let originalOwnerId = '';
let newOwnerId = '';

// Test data
const testUsers = {
  originalOwner: {
    name: 'Test Owner 1',
    username: 'testowner1',
    email: 'testowner1@example.com',
    password: 'password123',
    consentGiven: true
  },
  newOwner: {
    name: 'Test Owner 2', 
    username: 'testowner2',
    email: 'testowner2@example.com',
    password: 'password123',
    consentGiven: true
  }
};

const testPool = {
  name: 'Test Pool for Owner Change',
  address: '123 Test Street',
  type: 'residential',
  size: {
    value: 500,
    unit: 'sqft'
  },
  volume: {
    value: 15000,
    unit: 'gallons'
  }
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

async function createPool(poolData, token) {
  try {
    const response = await axios.post(`${BASE_URL}/pools`, poolData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data._id;
  } catch (error) {
    console.error('Error creating pool:', error.response?.data || error.message);
    throw error;
  }
}

async function updatePoolOwner(poolId, newOwnerId, token) {
  try {
    const response = await axios.put(`${BASE_URL}/pools/${poolId}`, {
      owner: newOwnerId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating pool owner:', error.response?.data || error.message);
    throw error;
  }
}

async function getPool(poolId, token) {
  try {
    const response = await axios.get(`${BASE_URL}/pools/${poolId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting pool:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function testPoolOwnerChange() {
  console.log('🧪 Starting pool owner change test...\n');

  try {
    // Step 1: Create test users
    console.log('1. Creating test users...');
    originalOwnerId = await createUser(testUsers.originalOwner);
    newOwnerId = await createUser(testUsers.newOwner);
    console.log(`✅ Original owner created with ID: ${originalOwnerId}`);
    console.log(`✅ New owner created with ID: ${newOwnerId}\n`);

    // Step 2: Login as original owner
    console.log('2. Logging in as original owner...');
    authToken = await loginUser(testUsers.originalOwner.username, testUsers.originalOwner.password);
    console.log('✅ Logged in successfully\n');

    // Step 3: Create a pool
    console.log('3. Creating test pool...');
    const poolDataWithOwner = { ...testPool, owner: originalOwnerId };
    poolId = await createPool(poolDataWithOwner, authToken);
    console.log(`✅ Pool created with ID: ${poolId}\n`);

    // Step 4: Verify pool ownership
    console.log('4. Verifying initial pool ownership...');
    const initialPool = await getPool(poolId, authToken);
    console.log(`✅ Pool owner: ${initialPool.data.owner._id} (${initialPool.data.owner.name})`);
    
    if (initialPool.data.owner._id !== originalOwnerId) {
      throw new Error('Initial pool ownership verification failed');
    }
    console.log('✅ Initial ownership verified correctly\n');

    // Step 5: Change pool owner
    console.log('5. Changing pool owner...');
    const updateResult = await updatePoolOwner(poolId, newOwnerId, authToken);
    console.log('✅ Pool owner update request completed');
    console.log(`✅ Updated pool data:`, updateResult.data);

    // Step 6: Verify the change
    console.log('\n6. Verifying pool owner change...');
    const updatedPool = await getPool(poolId, authToken);
    console.log(`✅ New pool owner: ${updatedPool.data.owner._id} (${updatedPool.data.owner.name})`);
    
    if (updatedPool.data.owner._id !== newOwnerId) {
      throw new Error('Pool ownership change verification failed');
    }
    console.log('✅ Pool ownership change verified correctly\n');

    // Step 7: Test with invalid owner ID
    console.log('7. Testing with invalid owner ID...');
    try {
      await updatePoolOwner(poolId, '507f1f77bcf86cd799439011', authToken); // Invalid MongoDB ID
      throw new Error('Should have failed with invalid owner ID');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly rejected invalid owner ID');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All tests passed! Pool owner change functionality is working correctly.');

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
  testPoolOwnerChange();
}

module.exports = { testPoolOwnerChange }; 