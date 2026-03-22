const http = require('http');

const data = JSON.stringify({
  name: 'TestUser',
  email: 'testuser' + Date.now() + '@demo.com',
  password: 'password123',
  role: 'user'
});

const req = http.request(
  { 
      hostname: 'localhost', 
      port: 5000, 
      path: '/api/auth/register', 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' } 
  },
  res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => console.log('Response:', res.statusCode, raw));
  }
);
req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();
