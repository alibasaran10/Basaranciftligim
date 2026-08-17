import http from 'http';

const loginData = JSON.stringify({ email: 'info@basaranciftligi.com', password: 'Parola00' });

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length,
  },
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const json = JSON.parse(body);
    const token = json.data.accessToken;
    console.log('Login successful, token acquired!');

    // Now fetch transactions
    http.get('http://localhost:4000/api/v1/finance/transactions?type=gelir&sortBy=date_desc&page=1&limit=12', {
      headers: { Authorization: `Bearer ${token}` }
    }, (res2) => {
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        console.log('Transactions API Status:', res2.statusCode);
        const data2 = JSON.parse(body2);
        console.log('Total count:', data2.meta?.pagination?.total);
        console.log('First 2 items:', data2.data?.slice(0, 2));
      });
    });
  });
});

req.write(loginData);
req.end();
