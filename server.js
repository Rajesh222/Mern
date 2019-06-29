const express = require('express');
const connectDB = require('./config/db');

// database connection 
connectDB();
const app = express();
app.use(express.json({
  extended: false
}))
app.get('/', (req, res, next) => {
  res.send('API running');
});

app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/auth', require('./routes/api/auth'));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));