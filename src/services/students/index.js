const express = require("express");
const fs = require("fs"); //import to read and write file
const path = require("path"); //for relative pathing to json file
const uniqid = require("uniqid"); //for generating unique id for each student

const router = express.Router();

//get file content
function getFileContent() {
  //get the path to file
  const buffer = fs.readFileSync(path.join(__dirname, "students.json"));
  //stream file content and convert to string so its readable
  const content = buffer.toString();
  //parse string to JSON
  const studentsDB = JSON.parse(content);
  return studentsDB;
}

//get all students
router.get("/", (req, res) => {
  const data = getFileContent();

  res.send(data);
});

router.get("/:id", (req, res) => {
  // const buffer = fs.readFileSync(path.join(__dirname, "students.json"));
  // const studentsArray = JSON.parse(buffer.toString());
  const data = getFileContent();
  //filter the data to only show a single user with the exact id from req.params.id
  const user = data.filter((user) => user.id === req.params.id);

  res.send(user);
});

router.post("/", (req, res) => {
  //create a new user varialble from the req.body
  const newUser = req.body;
  // const buffer = fs.readFileSync(path.join(__dirname, "students.json"));
  // const content = buffer.toString();
  // const studentsDB = JSON.parse(content);
  const data = getFileContent();
  //create a property id for the new user with a unique id
  newUser.id = uniqid();
  //append the newUser to the existing array
  data.push(newUser);
  //write file by getting the path of the file and stringify the array of data
  fs.writeFileSync(path.join(__dirname, "students.json"), JSON.stringify(data));

  res.status(201).send({ id: newUser.id });
});

router.delete("/:id", (req, res) => {
  // const buffer = fs.readFileSync(path.join(__dirname, "students.json"));
  // const content = buffer.toString();
  // const studentsDB = JSON.parse(content);
  const data = getFileContent();
  //filter the data to exclude the student with id equal to req.params.id
  const newJson = data.filter((student) => student.id !== req.params.id);
  //write file by getting the path of the file and stringify the array of data
  fs.writeFileSync(
    path.join(__dirname, "students.json"),
    JSON.stringify(newJson)
  );

  res.status(204).send();
});

router.put("/:id", (req, res) => {
  // const buffer = fs.readFileSync(path.join(__dirname, "students.json"));
  // const content = buffer.toString();
  // const studentsDB = JSON.parse(content);
  const data = getFileContent();
  // similar to the delete method, filter out the student that need to be modified
  const newJson = data.filter((x) => x.id !== req.params.id);
  // get the modified student from req.body
  const modifiedStudent = req.body;
  // do not create a new id for the student but use the id from the params
  modifiedStudent.id = req.params.id;
  // add the modified student back to the newJson
  newJson.push(modifiedStudent);
  // write the newJson into the file
  fs.writeFileSync(
    path.join(__dirname, "students.json"),
    JSON.stringify(newJson)
  );

  res.send(newJson);
});

module.exports = router;
