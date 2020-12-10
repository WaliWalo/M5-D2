const cors = require("cors");
const express = require("express");
const listEndpoints = require("express-list-endpoints");
const students = require("./services/students");
const projects = require("./services/projects");
const { join } = require("path");
const {
  notFoundHandler,
  unauthorizedHandler,
  forbiddenHandler,
  catchAllHandler,
} = require("./errorHandling");
const hostname = "localhost";
const port = 3001;
const publicStudentFolderPath = join(__dirname, "../public/img/students");
const publicProjectsFolderPath = join(__dirname, "../public/img/projects");
const server = express();

server.use(cors());
server.use(express.json());
server.use(express.static(publicStudentFolderPath));
server.use(express.static(publicProjectsFolderPath));

server.use("/students", students);
server.use("/projects", projects);

// ERROR HANDLERS MUST BE USED AFTER ALL THE ROUTES
// ERROR MIDDLEWARE MUST HAPPEN LAST
server.use(notFoundHandler);
server.use(unauthorizedHandler);
server.use(forbiddenHandler);
server.use(catchAllHandler);

console.log(listEndpoints(server));

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
