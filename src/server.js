const express = require("express");
const userRouter = require("./routes/userRoutes");
const expenseRouter = require("./routes/expenseRouter");
const cors = require("cors");
const goalRouter = require("./routes/routeing");
const app = express();

app.use(cors())
app.use(express.json());

app.use("/auth", userRouter);
app.use("/expense", expenseRouter);
app.use("/goals", goalRouter);

app.listen(3001,()=>{
  console.log("server running on 3001")
})