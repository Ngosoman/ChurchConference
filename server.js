const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/api/stk', async (req, res) => {
  const { phone } = req.body;

  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const password = Buffer.from(
    `${process.env.SHORTCODE}${process.env.PASSKEY}${timestamp}`
  ).toString('base64');

  try {
    // Get Access Token
    const tokenResponse = await axios.get(
      'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
            ).toString('base64'),
        },
      }
    );

    const access_token = tokenResponse.data.access_token;

    // Initiate STK Push
    const stkResponse = await axios.post(
      'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: 500,
        PartyA: phone,
        PartyB: process.env.SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: 'https://yourdomain.com/api/callback', // can leave dummy
        AccountReference: process.env.ACCOUNT_REF,
        TransactionDesc: 'Church Conference Payment',
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    res.json({ success: true, message: 'STK push sent', response: stkResponse.data });
  } catch (error) {
    console.error('Payment error:', error.message);
    res.status(500).json({ success: false, message: 'Payment error', error: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
