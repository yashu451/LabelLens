require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LabelLens backend is running!',
  });
});

// Start listening for incoming requests
app.listen(PORT, () => {
  console.log(`LabelLens server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
