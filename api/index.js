const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());

// Load service account credentials from environment
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

app.get('/api/sheet-data', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = process.env.RANGE || 'Sheet1!I9';

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    if (result.data.values && result.data.values.length > 0) {
      const amount = parseInt(result.data.values[0][0]) || 0;
      res.json({ amount, success: true });
    } else {
      res.json({ amount: 0, success: false, error: 'No data found' });
    }
  } catch (error) {
    console.error('Error accessing spreadsheet:', error);
    res.status(500).json({ 
      amount: 0, 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
