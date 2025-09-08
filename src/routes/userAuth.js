const jwt = require("jsonwebtoken");

const userAuth = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "Token not found" });
  }
  try {
    const decoded = jwt.verify(token, "wealthwise2025");
    req.user = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token not verified" });
  }
};

module.exports = userAuth;
