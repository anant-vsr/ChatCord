require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const errorHandler = require("./handlers/errorHandler");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Cross Origin
app.use(require("cors")());

// Setup mongoose
mongoose.set("useNewUrlParser", true);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

mongoose.connect(process.env.MONGODB_URL, (error) => {
  if (error) {
    console.log("Mongoose connection ERROR:", error.message);
  } else {
    console.log("Connected to database.");
  }
});

// Bring in the models
require("./models/User");
require("./models/Chatroom");
require("./models/Message");

// Bring in the routes
app.use("/user", require("./routes/user"));
app.use("/chatroom", require("./routes/chatroom"));
app.use("/messages", require("./routes/messages"));

// Setup error handlers
app.use(errorHandler.notFound);
app.use(errorHandler.mongooseErrors);
if (process.env.ENV === "DEVELOPMENT") {
  app.use(errorHandler.developmentErrors);
} else {
  app.use(errorHandler.productionErrors);
}

const server = app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}...`);
});

const io = require("socket.io")(server);
const jwt = require("jwt-then");
const Message = mongoose.model("Message");
const User = mongoose.model("User");
const ADMINID = "admin";

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token;
    const payload = await jwt.verify(token, process.env.SECRET);
    socket.userId = payload.id;
    next();
  } catch (err) {}
});

io.on("connection", (socket) => {
  console.log("Connected: " + socket.userId);

  socket.on("disconnect", () => {
    console.log("Disconnected: ", socket.userId);
  });

  socket.on("joinRoom", async ({ chatroomId }) => {
    const user = await User.findOne({ _id: socket.userId });
    const newMessage = {
      message: user.username + " joined the channel!",
      username: "",
      userId: ADMINID,
    };
    io.to(chatroomId).emit("newMessage", newMessage);
    socket.join(chatroomId);
  });

  socket.on("leaveRoom", async ({ chatroomId }) => {
    const user = await User.findOne({ _id: socket.userId });
    const newMessage = {
      message: user.username + " left the channel!",
      username: "",
      userId: ADMINID,
    };
    io.to(chatroomId).emit("newMessage", newMessage);
    socket.leave(chatroomId);
  });

  socket.on("newMessage", async ({ chatroomId, message }) => {
    if (message.trim().length > 0) {
      const user = await User.findOne({ _id: socket.userId });
      const newMessage = new Message({
        chatroom: chatroomId,
        user: socket.userId,
        message,
      });
      io.to(chatroomId).emit("newMessage", {
        message,
        username: user.username,
        userId: socket.userId,
      });
      //await newMessage.save();
    }
  });
});
