const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
  check,
  validationResult
} = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const User = require('../../models/Users')


router.get('/', auth, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).send('Server Error');
  }

});


router.post('/',
  [
    check('email', 'Please include valid email').isEmail(),
    check('password', 'Password required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    const {
      email,
      password
    } = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (!user) {
        return res.status(400).json({
          errors: [{
            msg: 'InValid Credential'
          }]
        })
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          errors: [{
            msg: 'InValid Credential'
          }]
        })
      }
      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(payload, config.get('jwtToken'), {
          expiresIn: 360000
        },
        (err, token) => {
          if (err) {
            throw err;
          }
          res.json({
            token
          })
        }
      );


    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  });


module.exports = router;