const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ENV: CONSUMER_KEY, CONSUMER_SECRET, SHORTCODE, PASSKEY

app.post('/api/stk', async (req, res) => {
  const phone = req.body.phone;
  const amount = 500;

  try {
    // 1. Generate access token
    const auth = Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString('base64');
    const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    const access_token = tokenRes.data.access_token;

    // 2. Get timestamp
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

    // 3. Password
    const password = Buffer.from(`${process.env.SHORTCODE}${process.env.PASSKEY}${timestamp}`).toString('base64');

    // 4. Make STK Push request
    const stkRes = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: "https://your-backend-url.com/api/callback",
        AccountReference: "ChurchConf2025",
        TransactionDesc: "Church Conference Registration"
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    res.json({ success: true, data: stkRes.data });
  } catch (err) {
    console.error(err.message);
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
