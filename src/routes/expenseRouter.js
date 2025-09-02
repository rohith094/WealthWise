const express = require("express");
const expenseRouter = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const {User, Expenses} = require("../utilities/connection");


const upload = multer({ dest: "uploads/" });

expenseRouter.post("/add", async (req, res) => {
  const { email, amount, category, merchant, date, paymentMethod, notes } = req.body;

  try {
    if (!email || !amount || !category || !paymentMethod || !date) {
      return res.status(400).json({ message: "Missing required fields"});
    }
    const user = await User.findOne({"email" : email});
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const expense = await Expenses.create({
      email,
      amount,
      category,
      merchant,
      date,
      paymentMethod,
      notes
    });

    return res.status(201).json({ message: "Expense added successfully", expense });

  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ errors: messages });
    }

    return res.status(500).json({ error: err.message });
  }
});


expenseRouter.post("/add-bulk-expenses", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data.length) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    let expensesToInsert = [];

    for (const row of data) {
      let user = null;
      if (row.email) {
        user = await User.findOne({ email: row.email });
        if (!user) {
          return res
            .status(400)
            .json({ error: `User with email ${row.email} not found` });
        }
      } else {
        return res
          .status(400)
          .json({ error: "Email is required in Excel to map expenses" });
      }

      expensesToInsert.push({
        email: row.email,
        amount: row.amount,
        category: row.category,
        merchant: row.merchant || "",
        date: row.date ? new Date(row.date) : new Date(),
        paymentMethod: row.paymentMethod,
        notes: row.notes || "",
      });
    }

    const insertedExpenses = await Expenses.insertMany(expensesToInsert);

    return res.status(201).json({
      message: "Expenses added successfully",
      insertedCount: insertedExpenses.length,
    });
  } catch (err) {
    if (err.name === "ValidationError" || err.writeErrors) {
      let messages = [];
      if (err.writeErrors) {
        err.writeErrors.forEach((e) => {
          messages.push(e.err.errmsg || e.err.message);
        });
      } else {
        Object.values(err.errors).forEach((val) => {
          messages.push(val.message);
        });
      }
      return res.status(400).json({ errors: messages });
    }

    console.error("Error processing bulk expenses:", err);
    return res.status(500).json({
      error: "Failed to add expenses",
      details: err.message,
    });
  }
});
module.exports = expenseRouter;