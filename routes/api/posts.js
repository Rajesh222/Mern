const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.send('Posts API'));

module.exports = router;