const express = require("express");
const userRouter = require("./routes/userRoutes");
const expenseRouter = require("./routes/expenseRouter");
const app = express();
app.use(express.json());

app.use("/user", userRouter);
app.use("/expense", expenseRouter);

app.listen(3001,()=>{
  console.log("server running on 3001")
})