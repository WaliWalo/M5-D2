const express = require("express");
const fs = require("fs"); //import to read and write file
const path = require("path"); //for relative pathing to json file
const uniqid = require("uniqid"); //for generating unique id for each student
const { check, validationResult, body } = require("express-validator");
const router = express.Router();
const multer = require("multer");
const { readDB, writeDB } = require("../../lib/utilities");
const { writeFile } = require("fs-extra");
const upload = multer({});
const projectsFolderPath = path.join(__dirname, "../../../public/img/projects");
const studentFilePath = path.join(__dirname, "../students/students.json");
const projectFilePath = path.join(__dirname, "projects.json");

//get file content
function getFileContent() {
  //get the path to file
  const buffer = fs.readFileSync(path.join(__dirname, "projects.json"));
  //stream file content and convert to string so its readable
  const content = buffer.toString();
  //parse string to JSON
  const projectsDB = JSON.parse(content);
  return projectsDB;
}

//get all projects
router.get("/", async (req, res, next) => {
  try {
    const data = await readDB(projectFilePath);
    if (req.query && req.query.name) {
      const filteredData = data.filter(
        (user) =>
          user.hasOwnProperty("name") &&
          user.name.toLowerCase().includes(req.query.name.toLowerCase())
      );
      res.send(filteredData);
    } else {
      res.send(data);
    }
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const data = await readDB(projectFilePath);
    //filter the data to only show a single user with the exact id from req.params.id
    const project = data.filter((project) => project.id === req.params.id);
    if (project.length > 0) {
      res.send(project);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  [
    check("name")
      .isLength({ min: 4 })
      .withMessage("No way! Name too short!")
      .exists()
      .withMessage("Insert a name please!"),
    check("repoUrl")
      .isURL()
      .withMessage("Enter a valid url please!")
      .exists()
      .withMessage("Insert a url please!"),
    check("liveUrl").isURL().withMessage("Enter a valid url please!"),
    check("studentId").exists().withMessage("Insert Student Id!"),
    // check("dob")
    //   .isDate()
    //   .withMessage("Date of Birth must be date!")
    //   .exists()
    //   .withMessage("Insert Date of Birth Please!"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error();
        err.message = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        //create a new project varialble from the req.body
        const newProject = req.body;
        const data = await readDB(projectFilePath);
        //create a property id for the new project with a unique id
        newProject.id = uniqid();
        //GET STUDENTS AND UPDATE
        // const buffer = fs.readFileSync(
        //   path.join(__dirname, "../students/students.json")
        // );
        // const content = buffer.toString();
        // const studentsDB = JSON.parse(content);
        const studentsDB = await readDB(studentFilePath);
        const newStudentsDB = studentsDB.filter(
          (student) => student.id !== newProject.studentId
        );
        const modifiedStudent = studentsDB.filter(
          (student) => student.id === newProject.studentId
        );
        let temp;
        if (modifiedStudent[0].numberOfProjects) {
          temp = modifiedStudent[0].numberOfProjects;
        } else {
          temp = 0;
        }
        modifiedStudent[0].numberOfProjects = temp + 1;
        newStudentsDB.push(modifiedStudent[0]);
        // fs.writeFileSync(
        //   path.join(__dirname, "../students/students.json"),
        //   JSON.stringify(newStudentsDB)
        // );
        await writeDB(studentFilePath, newStudentsDB);
        //append the newProject to the existing array
        data.push(newProject);
        //write file by getting the path of the file and stringify the array of data
        // fs.writeFileSync(
        //   path.join(__dirname, "projects.json"),
        //   JSON.stringify(data)
        // );
        await writeDB(projectFilePath, data);

        res.status(201).send(newProject);
      }
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", async (req, res) => {
  const data = await readDB(projectFilePath);
  //filter the data to exclude the project with id equal to req.params.id
  const newJson = data.filter((project) => project.id !== req.params.id);
  //get selected project
  const selectedProject = data.filter(
    (project) => project.id === req.params.id
  );
  //GET STUDENTS AND UPDATE PROJECT COUNT
  // const buffer = fs.readFileSync(
  //   path.join(__dirname, "../students/students.json")
  // );
  // const content = buffer.toString();
  // const studentsDB = JSON.parse(content);
  const studentsDB = await readDB(studentFilePath);
  const newStudentsDB = studentsDB.filter(
    (student) => student.id !== selectedProject[0].studentId
  );
  const modifiedStudent = studentsDB.filter(
    (student) => student.id === selectedProject[0].studentId
  );
  if (modifiedStudent[0].numberOfProjects) {
    modifiedStudent[0].numberOfProjects =
      modifiedStudent[0].numberOfProjects - 1;
  } else {
    modifiedStudent[0].numberOfProjects = 0;
  }
  newStudentsDB.push(modifiedStudent[0]);
  // fs.writeFileSync(
  //   path.join(__dirname, "../students/students.json"),
  //   JSON.stringify(newStudentsDB)
  // );
  await writeDB(studentFilePath, newStudentsDB);
  //write file by getting the path of the file and stringify the array of data
  // fs.writeFileSync(
  //   path.join(__dirname, "projects.json"),
  //   JSON.stringify(newJson)
  // );
  await writeDB(projectFilePath, newJson);
  res.status(204).send();
});

router.put("/:id", async (req, res) => {
  const data = await readDB(projectFilePath);
  // similar to the delete method, filter out the project that need to be modified
  const newJson = data.filter((x) => x.id !== req.params.id);
  // get the modified project from req.body
  const modifiedProject = req.body;
  // do not create a new id for the project but use the id from the params
  modifiedProject.id = req.params.id;
  // add the modified project back to the newJson
  newJson.push(modifiedProject);
  // write the newJson into the file
  // fs.writeFileSync(
  //   path.join(__dirname, "projects.json"),
  //   JSON.stringify(newJson)
  // );
  await writeDB(projectFilePath, newJson);

  res.send(newJson);
});

router.post(
  "/:id/uploadPhoto",
  upload.single("profImg"),
  async (req, res, next) => {
    try {
      await writeFile(
        path.join(projectsFolderPath, `${req.params.id}.jpg`),
        req.file.buffer
      );
      res.send("Image uploaded.");
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = router;
