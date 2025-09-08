const express = require("express");
const expenseRouter = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const { User, Expenses } = require("../utilities/connection");


const upload = multer({ dest: "uploads/" });

// expenseRouter.post("/add", async (req, res) => {
//   const { email, amount, category, merchant, date, paymentMethod, notes } = req.body;

//   try {
//     if (!email || !amount || !category || !paymentMethod || !date) {
//       return res.status(400).json({ message: "Missing required fields"});
//     }
//     const user = await User.findOne({"email" : email});
//     if (!user) {
//       return res.status(400).json({ message: "Invalid user" });
//     }

//     const expense = await Expenses.create({
//       email,
//       amount,
//       category,
//       merchant,
//       date,
//       paymentMethod,
//       notes
//     });

//     return res.status(201).json({ message: "Expense added successfully", expense });

//   } catch (err) {
//     if (err.name === "ValidationError") {
//       const messages = Object.values(err.errors).map((val) => val.message);
//       return res.status(400).json({ errors: messages });
//     }

//     return res.status(500).json({ error: err.message });
//   }
// });

expenseRouter.post("/add", async (req, res) => {
  const { email, amount, category, merchant, date, paymentMethod, notes } = req.body;

  try {
    if (!email || !amount || !category || !date || !merchant) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

    // Add expense
    const expense = await Expenses.create({
      email,
      amount,
      category,
      merchant,
      date,
      notes,
    });

    // Update user financials using updateOne
    await User.updateOne(
      { email },
      [
        {
          $set: {
            expenses: { $add: ["$expenses", amount] },
            balance: {
              $subtract: [
                { $ifNull: ["$balance", "$income"] },
                amount
              ]
            }
          }
        }
      ]
    );


    // Fetch updated user
    const updatedUser = await User.findOne({ email });

    return res.status(201).json({
      message: "Expense added successfully",
      expense,
      updatedUser: {
        income: updatedUser.income,
        expenses: updatedUser.expenses,
        balance: updatedUser.balance,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ errors: messages });
    }
    return res.status(500).json({ error: err.message });
  }
});

// expenseRouter.post("/add-bulk-expenses", upload.single("file"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "No file uploaded" });
//   }

//   const filePath = req.file.path;

//   try {
//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const data = xlsx.utils.sheet_to_json(sheet);

//     if (!data.length) {
//       return res.status(400).json({ error: "Excel file is empty" });
//     }

//     let expensesToInsert = [];

//     for (const row of data) {
//       let user = null;
//       if (row.email) {
//         user = await User.findOne({ email: row.email });
//         if (!user) {
//           return res
//             .status(400)
//             .json({ error: `User with email ${row.email} not found` });
//         }
//       } else {
//         return res
//           .status(400)
//           .json({ error: "Email is required in Excel to map expenses" });
//       }

//       expensesToInsert.push({
//         email: row.email,
//         amount: row.amount,
//         category: row.category,
//         merchant: row.merchant || "",
//         date: row.date ? new Date(row.date) : new Date(),
//         paymentMethod: row.paymentMethod,
//         notes: row.notes || "",
//       });
//     }

//     const insertedExpenses = await Expenses.insertMany(expensesToInsert);

//     return res.status(201).json({
//       message: "Expenses added successfully",
//       insertedCount: insertedExpenses.length,
//     });
//   } catch (err) {
//     if (err.name === "ValidationError" || err.writeErrors) {
//       let messages = [];
//       if (err.writeErrors) {
//         err.writeErrors.forEach((e) => {
//           messages.push(e.err.errmsg || e.err.message);
//         });
//       } else {
//         Object.values(err.errors).forEach((val) => {
//           messages.push(val.message);
//         });
//       }
//       return res.status(400).json({ errors: messages });
//     }

//     console.error("Error processing bulk expenses:", err);
//     return res.status(500).json({
//       error: "Failed to add expenses",
//       details: err.message,
//     });
//   }
// });


// Helper: format to YYYY-MM-DD

const formatDate = (dateValue) => {
  if (!dateValue) return null;

  // Excel serial numbers
  if (typeof dateValue === "number") {
    const jsDate = xlsx.SSF.parse_date_code(dateValue);
    if (!jsDate) return null;
    return `${jsDate.y}-${String(jsDate.m).padStart(2, "0")}-${String(jsDate.d).padStart(2, "0")}`;
  }

  // Strings
  const parsed = dayjs(dateValue, ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY"], true);
  if (parsed.isValid()) return parsed.format("YYYY-MM-DD");

  return null;
};

// expenseRouter.post("/add-bulk-expenses", upload.single("file"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "No file uploaded" });
//   }

//   const filePath = req.file.path;

//   try {
//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const data = xlsx.utils.sheet_to_json(sheet);

//     if (!data.length) {
//       return res.status(400).json({ error: "Excel file is empty" });
//     }

//     let expensesToInsert = [];
//     let userExpenseMap = {}; // { email: totalAmount }
//     let skippedRows = [];

//     for (let index = 0; index < data.length; index++) {
//       const row = data[index];

//       if (!row.email) {
//         skippedRows.push({ row: index + 2, reason: "Email is required" });
//         continue;
//       }

//       const user = await User.findOne({ email: row.email });
//       if (!user) {
//         skippedRows.push({ row: index + 2, reason: `User with email ${row.email} not found` });
//         continue;
//       }

//       const expenseAmount = Number(row.amount) || 0;
//       const expenseDate = row.date ? formatDate(row.date) : formatDate(new Date());

//       if (!expenseDate) {
//         skippedRows.push({ row: index + 2, reason: "Invalid date format" });
//         continue;
//       }

//       // Duplicate check
//       const isDuplicate = await Expenses.findOne({
//         email: row.email,
//         amount: expenseAmount,
//         category: row.category,
//         merchant: row.merchant || "",
//         date: expenseDate,
//       });

//       if (isDuplicate) {
//         skippedRows.push({ row: index + 2, reason: "Duplicate entry" });
//         continue;
//       }

//       // Add to insert list
//       expensesToInsert.push({
//         email: row.email,
//         amount: expenseAmount,
//         category: row.category,
//         merchant: row.merchant || "",
//         date: expenseDate, // always YYYY-MM-DD
//         notes: row.notes || "",
//       });

//       // Track user totals
//       if (!userExpenseMap[row.email]) {
//         userExpenseMap[row.email] = 0;
//       }
//       userExpenseMap[row.email] += expenseAmount;
//     }

//     // Insert valid expenses
//     const insertedExpenses = await Expenses.insertMany(expensesToInsert);

//     // Update user balances/expenses
//     for (const [email, totalAmount] of Object.entries(userExpenseMap)) {
//       await User.updateOne(
//         { email },
//         [
//           {
//             $set: {
//               expenses: { $add: ["$expenses", totalAmount] },
//               balance: {
//                 $subtract: [
//                   { $ifNull: ["$balance", "$income"] },
//                   totalAmount,
//                 ],
//               },
//             },
//           },
//         ]
//       );
//     }

//     return res.status(201).json({
//       message: "Bulk expenses processed",
//       insertedCount: insertedExpenses.length,
//       skippedCount: skippedRows.length,
//       skippedRows,
//       updatedUsers: Object.keys(userExpenseMap).length,
//     });
//   } catch (err) {
//     console.error("Error processing bulk expenses:", err);
//     return res.status(500).json({
//       error: "Failed to add expenses",
//       details: err.message,
//     });
//   }
// });


expenseRouter.post("/add-bulk-expenses", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

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
    let userExpenseMap = {}; // { email: totalAmount }
    let skippedRows = [];
    let seenInExcel = new Set(); // track duplicates inside file

    for (let index = 0; index < data.length; index++) {
      const row = data[index];

      if (!row.email) {
        skippedRows.push({ row: index + 2, reason: "Email is required" });
        continue;
      }

      const user = await User.findOne({ email: row.email });
      if (!user) {
        skippedRows.push({ row: index + 2, reason: `User with email ${row.email} not found` });
        continue;
      }

      const expenseAmount = Number(row.amount) || 0;
      const expenseDate = row.date ? formatDate(row.date) : formatDate(new Date());

      if (!expenseDate) {
        skippedRows.push({ row: index + 2, reason: "Invalid date format" });
        continue;
      }

      const expenseKey = `${row.email}-${expenseAmount}-${row.category}-${row.merchant || ""}-${expenseDate}`;

      // ✅ Check duplicate inside the Excel itself
      if (seenInExcel.has(expenseKey)) {
        skippedRows.push({ row: index + 2, reason: "Duplicate in Excel file" });
        continue;
      }
      seenInExcel.add(expenseKey);

      // ✅ Check duplicate in database
      const isDuplicate = await Expenses.findOne({
        email: row.email,
        amount: expenseAmount,
        category: row.category,
        merchant: row.merchant || "",
        date: expenseDate,
      });

      if (isDuplicate) {
        skippedRows.push({ row: index + 2, reason: "Duplicate in database" });
        continue;
      }

      // Add to insert list
      expensesToInsert.push({
        email: row.email,
        amount: expenseAmount,
        category: row.category,
        merchant: row.merchant || "",
        date: expenseDate,
        notes: row.notes || "",
      });

      // Track totals for user update
      if (!userExpenseMap[row.email]) {
        userExpenseMap[row.email] = 0;
      }
      userExpenseMap[row.email] += expenseAmount;
    }

    // Insert valid expenses
    const insertedExpenses = await Expenses.insertMany(expensesToInsert);

    // Update user balances/expenses
    for (const [email, totalAmount] of Object.entries(userExpenseMap)) {
      await User.updateOne(
        { email },
        [
          {
            $set: {
              expenses: { $add: ["$expenses", totalAmount] },
              balance: {
                $subtract: [
                  { $ifNull: ["$balance", "$income"] },
                  totalAmount,
                ],
              },
            },
          },
        ]
      );
    }

    return res.status(201).json({
      message: "Bulk expenses processed",
      insertedCount: insertedExpenses.length,
      skippedCount: skippedRows.length,
      skippedRows,
      updatedUsers: Object.keys(userExpenseMap).length,
    });
  } catch (err) {
    console.error("Error processing bulk expenses:", err);
    return res.status(500).json({
      error: "Failed to add expenses",
      details: err.message,
    });
  }
});
expenseRouter.get('/download-expenses', async (req, res) => {
  try {
    const expenses = await Expenses.find({}, { _id: 0, __v: 0 }).lean();

    if (!expenses.length) {
      return res.status(404).json({ message: 'No expenses found' });
    }
    const excelData = [];
    const headers = Object.keys(expenses[0]);
    excelData.push(headers);
    expenses.forEach(exp => {
      const row = headers.map(header => {
        const value = exp[header];
        if (value instanceof Date) {
          const day = String(value.getDate()).padStart(2, '0');
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const year = value.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return value;
      });
      excelData.push(row);
    });
    const ws = xlsx.utils.aoa_to_sheet(excelData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Expenses Report');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=expenses_report.xlsx'
    );
    const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.end(buffer);
  } catch (error) {
    console.error('Error generating expenses report:', error);
    res.status(500).send('An error occurred while generating the report');
  }
});

module.exports = expenseRouter;