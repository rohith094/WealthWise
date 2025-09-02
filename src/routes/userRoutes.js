const express = require("express");
const userRouter = express.Router();
const {User} = require("../utilities/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

userRouter.post("/register", async (req, res)=>{
  const {email,password} = req.body;
  try{
    const existing = await User.findOne({"email" : email});
    if(existing){
      return res.json({"message" : "user already exists"}); 
    }
    const hashedpassword = await bcrypt.hash(password,10);
    await User.create({
      email,
      password : hashedpassword 
    }) 
    return res.status(201).json({ message: "User registered successfully" }); 
  }catch(err){
    return res.status(500).json({"error" : err.message}) 
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


module.exports = userRouter;