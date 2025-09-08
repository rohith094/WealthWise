const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/Wealth_Wise").then(()=>{
  console.log("connected to database");
})

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"], 
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"],
    maxlength: [20, "Username cannot be more than 20 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    match: [/^[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,}$/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  income: {
    type: Number,
    default: 50000, // default income (you can change this)
  },
  expenses: {
    type: Number,
    default: 0,
  },
  balance: {
    type: Number,
    default: function () {
      return this.income; // initially balance = income
    },
  },
  merchant: {
    type: String,
    trim: true,
    minlength: [2, "Merchant name must be at least 2 characters long"],
    maxlength: [50, "Merchant name cannot be more than 50 characters"],
    match: [/^[A-Za-z\s]+$/, "Merchant name should contain only letters and spaces"],
    default: "Self", // default merchant if not provided
  },
});

const expenseSchema = mongoose.Schema({
  email: {
    type: String,
    ref: "User",
    required: [true, "email is required"]
  },
  amount: {
    type: Number,
    required: [true, "Expense amount is required"],
    min: [1, "Amount must be greater than 0"]
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: {
      values: [
        "Food",
        "Transport",
        "Shopping",
        "Bills",
        "Entertainment",
        "Healthcare",
        "Education",
        "Other"
      ],
      message: "Invalid category"
    }
  },
  merchant: {
    type: String,
    trim: true,
    maxlength: [50, "Merchant name cannot exceed 50 characters"]
  },
  date: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function (value) {
        return value <= new Date(); // cannot be a future date
      },
      message: "Date cannot be in the future"
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, "Notes cannot exceed 200 characters"]
  }
});

const goalSchema = mongoose.Schema({
  email: {
    type: String,
    ref: "User",
    required: [true, "Email is required"],
  },
  title: {
    type: String,
    required: [true, "Goal title is required"],
    trim: true,
    maxlength: [100, "Goal title cannot exceed 100 characters"],
  },
  goalId: {
    type: String,
    unique: true,
  },
  targetAmount: {
    type: Number,
    required: [true, "Target amount is required"],
    min: [1, "Target must be greater than 0"],
  },
  savedAmount: {
    type: Number,
    default: 0,
    min: [0, "Saved amount cannot be negative"],
  },
  deadline: {
    type: Date,
    required: [true, "Deadline is required"],
    validate: {
      validator: function (value) {
        return value > new Date();
      },
      message: "Deadline must be a future date",
    },
  },
  status: {
    type: String,
    enum: ["Started", "Pending", "Completed", "Delayed"],
    default: "Pending",
  },
  progress: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    maxlength: [200, "Notes cannot exceed 200 characters"],
    trim: true,
  },
});

const Expenses = mongoose.model("expenses", expenseSchema);
const User = mongoose.model("users", userSchema);
const Goal = mongoose.model("goals", goalSchema);
module.exports = {User, Expenses,Goal};