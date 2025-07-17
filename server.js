const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ Setup CORS properly
app.use(cors({
  origin: 'http://127.0.0.1:5500', // You can replace * with 'http://127.0.0.1:5500' for stricter security
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Base64 Encode credentials
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;

const shortCode = '400200';
const passkey = process.env.PASSKEY;
const accountReference = '40064743';
const callbackURL = 'https://mydomain.com/callback';

// Get OAuth Token
const getAccessToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const res = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    return res.data.access_token;
  } catch (err) {
    console.error('❌ Error fetching access token:', err.message);
    return null;
  }
};

// ✅ Handle preflight CORS OPTIONS
app.options('/api/stk', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // or specify origin
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// STK Route
app.post('/api/stk', async (req, res) => {
  const { phone } = req.body;

  const accessToken = await getAccessToken();
  if (!accessToken) return res.status(500).json({ message: 'Failed to authenticate' });

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

  try {
    const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 100,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackURL,
      AccountReference: accountReference,
      TransactionDesc: 'Church Conference Registration'
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    res.status(200).json({ success: true, message: 'STK Push Sent ✅', data: stkRes.data });
  } catch (err) {
    console.error('❌ STK Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'STK Push Failed ❌', error: err.response?.data || err.message });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Church Conference Payment API Running ✅');
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
