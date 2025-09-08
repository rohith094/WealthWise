const express = require("express");
const { User, Goal } = require("../utilities/connection");
const goalRouter = express.Router();


// goalRouter.post("/addgoal", async (req, res) => {
//   const { email, title, targetAmount, deadline, notes } = req.body;

//   try {
//     if (!email || !title || !targetAmount || !deadline) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid user" });
//     }

//     // Generate goalId
//     const prefix = title.substring(0, 3).toUpperCase();
//     const count = await Goal.countDocuments({ title: new RegExp(`^${title}`, "i") });
//     const goalId = `${prefix}${String(count).padStart(3, "0")}`;

//     const goal = await Goal.create({
//       email,
//       title,
//       goalId,
//       targetAmount,
//       deadline,
//       notes,
//     });

//     return res.status(201).json({ message: "Goal added successfully", goal });
//   } catch (err) {
//     if (err.name === "ValidationError") {
//       const messages = Object.values(err.errors).map((val) => val.message);
//       return res.status(400).json({ errors: messages });
//     }
//     return res.status(500).json({ error: err.message });
//   }
// });

goalRouter.post("/addgoal", async (req, res) => {
  let { email, title, targetAmount, deadline, notes } = req.body;

  try {
    if (!email || !title || !targetAmount || !deadline) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

    // Normalize title (lowercase for DB)
    const normalizedTitle = title.trim().toLowerCase();

    // Check for exact duplicate (same email + same normalized title)
    const existingGoal = await Goal.findOne({ email, title: normalizedTitle });
    if (existingGoal) {
      return res.status(400).json({ message: "Goal with this title already exists for the user" });
    }

    // Get prefix from first word, capitalize first letter
    const firstWord = normalizedTitle.split(" ")[0];
    const prefix = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);

    // Count how many goals already exist with this prefix
    const count = await Goal.countDocuments({ goalId: new RegExp(`^${prefix}\\d{3}$`, "i") });

    // Generate sequential goalId (e.g., Buy001, Buy002)
    const goalId = `${prefix}${String(count + 1).padStart(3, "0")}`;

    // Save the goal
    const goal = await Goal.create({
      email,
      title: normalizedTitle, // store in lowercase
      goalId,
      targetAmount,
      deadline,
      notes,
    });

    return res.status(201).json({ message: "Goal added successfully", goal });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate goal entry detected" });
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ errors: messages });
    }

    return res.status(500).json({ error: err.message });
  }
}); 

goalRouter.put("/add-contribution/:id", async (req, res) => {
  const { amount } = req.body;
  const goalid = req.params.id;
  try {
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid contribution amount" });
    }
    // Find goal by goalId instead of MongoDB _id
    const goal = await Goal.findOne({ "goalId": goalid});
    console.log(goal)
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const newSavedAmount = goal.savedAmount + amount;
    const newProgress = Math.min(
      (newSavedAmount / goal.targetAmount) * 100,
      100
    );

    let newStatus = "Pending";
    if (newProgress >= 100) {
      newStatus = "Completed";
    } else if (new Date() > goal.deadline) {
      newStatus = "Delayed";
    } else if (newSavedAmount > 0) {
      newStatus = "Started";
    }

    const updatedGoal = await Goal.updateOne(
      { goalId: req.params.id },
      {
        $set: {
          savedAmount: newSavedAmount,
          progress: newProgress,
          status: newStatus,
        },
      },{new: true}
    );

    return res.status(200).json({
      message: "Contribution added successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } 
});

goalRouter.get("/allgoals", async (req, res) => {
  try {
    const currentDate = new Date();

    // Bulk update expired goals
    await Goal.updateMany(
      { deadline: { $lt: currentDate }, status: { $ne: "Completed" } },
      { $set: { status: "Delayed" } }
    );

    // Fetch updated goals
    const goals = await Goal.find().sort({ createdAt: -1 });

    return res.status(200).json({ goals });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

goalRouter.delete("/delete/:id", async (req, res) => {
  try {
    const goalid = req.params.id;

    const result = await Goal.deleteOne({ goalId: goalid });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    return res.status(200).json({ message: "Goal deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


module.exports = goalRouter;