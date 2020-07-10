const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  let token = req.header("x-auth-token");

  // Check if token is available
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  //Verify token
  try {
    const decoded = jwt.verify(token, config.get("jwtToken"));
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
