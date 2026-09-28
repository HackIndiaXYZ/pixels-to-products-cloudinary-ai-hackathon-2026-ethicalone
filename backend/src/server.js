require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const assetRoutes = require('./routes/assets');
const ruleRoutes = require('./routes/rules');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/assets', assetRoutes);
app.use('/api/rules', ruleRoutes);

// Error handler. It must come after the routes.
app.use((err, req, res, next) => {
  console.error(err);
  let status = 500;
  if (err.name === 'CastError' || err.http_code === 404) status = 404;
  if (err.name === 'ValidationError') status = 400;
  res.status(status).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});