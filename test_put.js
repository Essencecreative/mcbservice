const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/projects/6a4b72931891c68480ec56a6',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});

req.end();
