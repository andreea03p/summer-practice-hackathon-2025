const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();


app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

module.exports = app;