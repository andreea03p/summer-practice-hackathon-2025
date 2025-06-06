require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

connectDB();

// Launch server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
