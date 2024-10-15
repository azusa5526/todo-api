const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");

// 載入環境變數
dotenv.config();

const app = express();
const port = 3000;

// 使用 CORS 中介
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  })
);

// Middlewares
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected."))
  .catch((err) => console.log(err));

// Define ToDo schema
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, required: true },
  sortIndex: { type: Number },
});

// Set the toJSON transform to change _id to id and remove __v
todoSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Define ToDo model
const Todo = mongoose.model("Todo", todoSchema);

// Routes
app.get("/todos", async (req, res) => {
  const todos = await Todo.find().sort({sortIndex: 'asc'});
  res.send(todos);
});

app.post("/todos", async (req, res) => {
  if (!req.body.title || req.body.completed === undefined) {
    return res
      .status(400)
      .send({ message: "Title and completed are required" });
  }

  if (req.body.sortIndex && !Number.isSafeInteger(req.body.sortIndex)) {
    return res.status(400).send({ message: "SortIndex is not safe int" });
  }

  const todo = new Todo({
    title: req.body.title,
    completed: req.body.completed,
    sortIndex: req.body.sortIndex,
  });

  await todo.save();
  res.send(todo);
});

app.put("/todos/:id", async (req, res) => {
  if (!req.body.title || req.body.completed === undefined) {
    return res
      .status(400)
      .send({ message: "Title and completed are required" });
  }

  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!todo) return res.status(404).send({ message: "Todo not found" });
    res.send(todo);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.delete("/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).send({ message: "Todo not found" });
    res.send({ message: "Todo deleted" });
  } catch (err) {
    res.status(400).send(err);
  }
});

// 用來一次更新所有待辦事項的 sortIndex
app.patch("/todos/sortIndex", async (req, res) => {
  const todos = req.body; // 從請求體中獲取新的排序索引數組

  if (!Array.isArray(todos)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const bulkOps = todos
      .filter((todo) => Number.isSafeInteger(todo.sortIndex))
      .map((todo) => ({
        updateOne: {
          filter: { _id: todo.id },
          update: { $set: { sortIndex: todo.sortIndex } },
        },
      }));

    await Todo.bulkWrite(bulkOps);

    res.status(200).json({ message: "Sort indexes updated successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating sort indexes." });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
