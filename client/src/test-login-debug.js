// Simple test to debug login API call
const testLogin = async () => {
  const API_URL = 'http://localhost:5000/api';
  
  console.log('Testing login API...');
  console.log('API URL:', API_URL);

  try {
    // Test server health first
    console.log('\n1. Testing server health...');
    const healthResponse = await fetch(`${API_URL}/health`);
    console.log('Health check status:', healthResponse.status);
    const healthData = await healthResponse.text();
    console.log('Health response:', healthData);

    // Test CORS
    console.log('\n2. Testing CORS...');
    const corsResponse = await fetch(`${API_URL}/test-cors`);
    console.log('CORS test status:', corsResponse.status);
    const corsData = await corsResponse.text();
    console.log('CORS response:', corsData);

    // Test login endpoint
    console.log('\n3. Testing login...');
    const loginData = {
      email: 'demo41@gmail.com',
      password: 'Password123' // Replace with actual password
    };

    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    console.log('Login response status:', loginResponse.status);
    const loginResult = await loginResponse.text();
    console.log('Login response:', loginResult);

  } catch (error) {
    console.error('Test error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

// Run the test
testLogin(); 