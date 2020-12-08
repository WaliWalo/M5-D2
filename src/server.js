const cors = require("cors");
const express = require("express");

const students = require("./services/students");
const hostname = "localhost";
const port = 3001;

const server = express();

server.use(cors());
server.use(express.json());
server.use("/students", students);
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
