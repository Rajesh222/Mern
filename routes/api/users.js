const express = require('express');
const router = express.Router();
const {
  check,
  validationResult
} = require('express-validator');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const config = require('config');
const User = require('../../models/Users')
router.post('/',
  [check('name', 'name  is required').not().isEmpty(),
    check('email', 'Please provide valid email').isEmail(),
    check('password', 'Password must be min of 6 character').isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      })
    }
    const {
      name,
      email,
      password
    } = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (user) {
        return res.status(409).json({
          errors: [{
            msg: 'User already exist'
          }]
        })
      }

      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      user = new User({
        name,
        email,
        avatar,
        password
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

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