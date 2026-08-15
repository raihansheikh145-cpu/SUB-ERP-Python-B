const http = require('http');

const loginData = JSON.stringify({
  email: 'admin@sub-erp.com',
  password: 'password'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const { access_token } = JSON.parse(data);
      if (!access_token) throw new Error('No access token in response: ' + data);
      
      const invReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/inventory/valuation?companyId=d9dbb775-6839-4201-9dda-caa39e271201',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + access_token
        }
      }, (invRes) => {
        let invData = '';
        invRes.on('data', (chunk) => { invData += chunk; });
        invRes.on('end', () => {
          console.log('Status:', invRes.statusCode);
          console.log('Response:', invData);
        });
      });
      invReq.on('error', console.error);
      invReq.end();
    } catch(e) {
      console.error(e);
    }
  });
});
loginReq.on('error', console.error);
loginReq.write(loginData);
loginReq.end();
