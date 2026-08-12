import http from 'http';

http.get('http://localhost:4000/api/v1/finance/transactions?type=gelir&sortBy=date_desc&page=1&limit=12', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response body snippet:', data.slice(0, 400));
  });
}).on('error', err => console.error(err));
