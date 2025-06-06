require('dotenv').config();
const express = require('express');
const dotenv = require('dotenv').config()
const cors = require("cors")
const {mongoose} = require('mongoose')
const cookieParser = require('cookie-parser')
const app = express();


// db connection
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('Database connected'))
.catch((err) => console.log('Database not connected', err))


// Apply CORS settings globally
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
  }));
  
  // Body parser middleware
  app.use(express.json());
  app.use(cookieParser())
  app.use(express.urlencoded({extended: false}))
  
  // Mount your routes
  const authRoutes = require('./routes/authRoutes');
  app.use('/', authRoutes);
  app.use(profileRoutes);

  app.use('/uploads', express.static('uploads'));

  const PORT = process.env.PORT;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
