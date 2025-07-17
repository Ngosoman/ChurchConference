// server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Church Conference Payment API Running ✅');
});

app.post('/api/stk', async (req, res) => {
  const { phone } = req.body;

  const shortcode = '174379'; // Daraja sandbox shortcode
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  try {
    // Step 1: Get access token
    const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      auth: {
        username: process.env.MPESA_CONSUMER_KEY,
        password: process.env.MPESA_CONSUMER_SECRET
      }
    });

    const access_token = tokenResponse.data.access_token;

    // Step 2: Initiate STK Push
    const stkPushResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: 1,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: 'https://mydummycallback.com/path',
        AccountReference: 'ChurchConf',
        TransactionDesc: 'Conference Payment'
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    res.status(200).json({ success: true, message: 'STK Push Sent ✅', data: stkPushResponse.data });
  } catch (error) {
    console.error('❌ STK Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
