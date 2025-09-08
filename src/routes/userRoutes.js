const express = require("express");
const userRouter = express.Router();
const {User} = require("../utilities/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const userAuth = require("./userAuth");

dotenv.config();

userRouter.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

userRouter.post("/login", async (req, res)=>{
  const {email, password} = req.body;
  try{
    if(!email || !password){
      return res.json({"error" : "email and password are required"});
    }
    const existing = await User.findOne({"email" : email});
    if(!existing){
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const match = await bcrypt.compare(password, existing.password);
    if(!match){
      return res.json({error : "password not match"});
    }
    const token = jwt.sign({ email }, "wealthwise2025", { expiresIn: "3h" });
    console.log('token', token);
    return res.json({ token });
  }catch(error){
    return res.status(500).json({"error" : error.message});
  }
})

userRouter.get("/all-users",userAuth, async (req, res) => {
  try {
    const users = await User.find({}, {_id : 0, password : 0}); 
    // exclude password field

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching users" });
  }
});

module.exports = userRouter;