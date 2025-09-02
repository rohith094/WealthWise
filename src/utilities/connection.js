const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/Wealth_Wise").then(()=>{
  console.log("connected to database");
})

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    match: [/^[A-z0-9]+@[A-z]+\.[A-z]{2,}$/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
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
  paymentMethod: {
    type: String,
    enum: {
      values: ["Cash", "Card", "UPI", "NetBanking", "Other"],
      message: "Invalid payment method"
    },
    required: [true, "Payment method is required"]
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, "Notes cannot exceed 200 characters"]
  }
});

const Expenses = mongoose.model("expenses", expenseSchema);
const User = mongoose.model("users", userSchema);

module.exports = {User, Expenses};