const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

let commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { content } = req.body;
  console.log(req.body);
  const comments = commentsByPostId[req.params.id] || [];

  comments.push({ id: commentId, content, status: "pending" });

  commentsByPostId[req.params.id] = comments;

  await axios.post("http://event-bus-srv:4005/events", {
    type: "CommentCreated",
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: "pending"
    }
  });

  res.status(201).send(comments);
});

app.post("/events", (req,res) =>{
  console.log("Event Received : ", req.body.type);
    const {type, data} = req.body;
    if(type === "CommentModerated"){
      const comments = commentsByPostId[data.postId];
      const comment = comments.find(comment => comment.id === data.id);
      comment.status = data.status;
      console.log(comment.status);
      axios.post("http://event-bus-srv:4005/events", {
        type: "CommentUpdated",
        data: {
          id: comment.id,
          status: comment.status,
          postId: data.postId,
          content: comment.content
        }
      })
    }

  res.send({});
});

app.listen(4001, () => {
  console.log("Listeing on port 4001");
});
