const express = require('express');
const connectDB = require('./config/db');

// database connection 
connectDB();
const app = express();
app.get('/', (req, res, next) => {
  res.send('API running');
})

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));