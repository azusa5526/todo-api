// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// 載入環境變數
dotenv.config();

const app = express();
const port = 3000;

// Middlewares
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected."))
  .catch((err) => console.log(err));

// Define ToDo model
const Todo = mongoose.model(
  "Todo",
  new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, required: true },
  })
);

// Routes
app.get("/todos", async (req, res) => {
  const todos = await Todo.find();
  console.log(todos[0].title);
  res.send(todos);
});

app.post("/todos", async (req, res) => {
  if (!req.body.title || req.body.completed === undefined) {
    return res
      .status(400)
      .send({ message: "Title and completed are required" });
  }

  const todo = new Todo({
    title: req.body.title,
    completed: req.body.completed,
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

app.listen(port, () => console.log(`Server running on port ${port}`));
