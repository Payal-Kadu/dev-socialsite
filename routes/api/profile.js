const express = require("express");
const request = require("request");
const config = require("config");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const router = express.Router();

// @route GET api/profile/me
// @desc Get current user profile
// @access Privte
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"], "User");

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile" });
    }
    res.json(profile);
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Server error");
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram,
    } = req.body;

    //Build Profile object

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;

    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    //Build Social Media objects
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      //Update profile
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        let profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      //Create profile
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

//@route GET api/profile
//@desc Get all profiles
//@access Public
router.get("/", async (req, res) => {
  try {
    const allProfiles = await Profile.find().populate(
      "user",
      ["name", "avatar"],
      "User"
    );

    res.json(allProfiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route api/profile/user/:user_id
//@desc Get profile by id
//access public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profileby_id = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"], "User");
    if (!profileby_id) {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.json(profileby_id);
  } catch (err) {
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//@route DELETE api/profile
//@desc delete user, profile, post
//@access private

router.delete("/", auth, async (req, res) => {
  try {
    //Remove user post
    await Post.deleteMany({ user: req.user.id });

    //Remove Profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //Remove User
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User Deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//@ route PUT api/profile/experience
//@desc Update Experience in profile
//@access private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      // check("location", "Location is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //TO access experience field we wrote profile.experience
      //unshift() is same as push the difference is that push() append object to end of array and unshift()
      //appends at the beginning of array.
      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

//@route DELETE api/profile/experience
//@desc delete user profile experience
//@access private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);

    // res.json({ msg: "Profile experience deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//@route PUT api/profile/education
//@desc update education in Profile
//@access private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldofstudy", "Field of study is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

//@route DELETE api/profile/education
//@desc delete user profile education
//@access private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get removed index
    const removedIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removedIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route  GET api/profile/github/:username
// @desc   Get user repos from github
// @access Public
router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };
    request(options, (error, response, body) => {
      if (error) console.log(error);
      if (response.statusCode !== 200)
        return res.status(404).json({ msg: "No Github profile found." });
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
