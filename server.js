const express = require('express');
const cors = require('cors');
const path = require('path');
const generatePdfHandler = require('./api/generate-pdf');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node'
  });
});

// PDF Generation Endpoint (shares implementation with Vercel Serverless Function)
app.post('/api/generate-pdf', (req, res) => generatePdfHandler(req, res));

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Exam PDF Studio server running on http://localhost:${PORT}`);
});

module.exports = app;
