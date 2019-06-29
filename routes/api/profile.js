const express = require('express');
const router = express.Router();
const {
  check,
  validationResult
} = require('express-validator');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const config = require('config');
const request = require('request');

// @route   GET api/profile/me
// @desc    Get current user profile 
// @access  Private
router.get('/me', auth, async (req, res) => {
  // Get profile
  const profile = await Profile.findOne({
    user: req.user.id
  }).populate('user', ['name', 'avatar']);

  if (!profile) {
    return res.status(400).json({
      msg: 'There is no Profile for this user'
    });
  }

  res.json(profile);
});

router.post('/', [auth, [
  check('status', 'Status is required').not().isEmpty(),
  check('skills', "Skills requied").not().isEmpty()
]], async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  // Get fields
  const profileFields = {};
  profileFields.user = req.user.id;
  if (req.body.handle) profileFields.handle = req.body.handle;
  if (req.body.company) profileFields.company = req.body.company;
  if (req.body.website) profileFields.website = req.body.website;
  if (req.body.location) profileFields.location = req.body.location;
  if (req.body.bio) profileFields.bio = req.body.bio;
  if (req.body.status) profileFields.status = req.body.status;
  if (req.body.githubusername)
    profileFields.githubusername = req.body.githubusername;
  // Skills - Spilt into array
  if (typeof req.body.skills !== 'undefined') {
    profileFields.skills = req.body.skills.split(',').map(skill => skill.trim());
  }

  // Social
  profileFields.social = {};
  if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
  if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
  if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
  if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if (req.body.instagram) profileFields.social.instagram = req.body.instagram;
  try {
    let profile = await Profile.findOne({
      user: req.user.id
    });

    if (profile) {
      // update the profile
      profile = await Profile.findOneAndUpdate({
        user: req.user.id
      }, {
        $set: profileFields
      }, {
        new: true
      });
      return res.json(profile)
    }

    // create one profile
    profile = new Profile(profileFields);
    await profile.save();

    res.send(profile);

  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile
// @desc    Get All user profiles 
// @access  public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.send(profiles);
  } catch (error) {
    res.status(500).send('Server Error');
  }

});

// @route   GET api/profile/user/:user_id
// @desc    Get user profiles by id
// @access  public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).send('There is no profile for this user')
    }
    res.send(profile);
  } catch (error) {
    res.status(500).send('Server Error');
  }

});

// @route   DELETE api/profile
// @desc    Delete user profiles by id
// @access  Private

router.delete('/', auth, async (req, res) => {
  console.log('req:', req.user)
  try {
    await Profile.findOneAndRemove({
      user: req.user.id
    });
    await User.findOneAndRemove({
      _id: req.user.id
    });
    res.send('Profile Deleted');
  } catch (error) {
    console.error(error)
    res.status(500).send('Server Error');
  }
});


// @route   Put api/profile/experiece
// @desc    Add user profiles Experience
// @access  Private

router.put('/experience', [auth,
    [check('title', 'Title is required').not().isEmpty(),
      check('company', 'company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array
      });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    }
    try {
      const profile = await Profile.findOne({
        user: req.user.id
      });

      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  }
);


// @route   Delete api/profile/experiece/:exp_id
// @desc    Delete user profiles Experience
// @access  Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({
      user: req.user.id
    });

    // Get  remove index

    const removeIndex = profile.experience.map(exp => exp.id).indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// @route   Get  api/profile/github/:username
// @desc    Get github user name 
// @access  Public

router.get('/github/:username', async (req, res) => {
  try {
    const option = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&
      client_id=${config.get('githubClientId')}&${config.get('githubClientSecret')}`,
      method: 'GET',
      headers: {
        'user-agent': 'node.js'
      }
    };
    request(option, (error, response, body) => {
      if (error) console.error(error.message);

      if (response.statusCode !== 200) {
        res.status(404).json({
          msg: 'No github profile found'
        });
      }
      res.json(JSON.parse(body));
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
})

module.exports = router;