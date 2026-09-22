const axios = require('axios');

async function test() {
  try {
    const login = await axios.post('http://localhost:8081/auth/login', {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    const token = login.data.access_token || login.data.token;
    console.log('Login OK, Token:', token ? 'Bearer ' + token.substring(0, 15) : 'Missing');

    const res = await axios.post('http://localhost:8081/products/images/bulk-fetch-missing', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Bulk Fetch Result:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error status:', err.response?.status);
    console.error('Error data:', err.response?.data);
    console.error('Error message:', err.message);
  }
}

test();
