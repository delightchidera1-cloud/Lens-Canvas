const http = require('http');

const data = JSON.stringify({
  sellerId: 'some-seller',
  productId: 'some-prod',
  count: 1
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/simulate-purchase',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
