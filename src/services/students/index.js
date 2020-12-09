const express = require("express");
const fs = require("fs"); //import to read and write file
const path = require("path"); //for relative pathing to json file
const uniqid = require("uniqid"); //for generating unique id for each student
const { check, validationResult, body } = require("express-validator");

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
router.get("/", (req, res, next) => {
  try {
    const data = getFileContent();
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

//get students with specific id
router.get("/:id", (req, res, next) => {
  try {
    const data = getFileContent();
    //filter the data to only show a single user with the exact id from req.params.id
    const user = data.filter((user) => user.id === req.params.id);

    if (user.length > 0) {
      res.send(user);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    next(error);
  }
});

//get projects belonging to a specific student id
router.get("/:id/projects", (req, res, next) => {
  try {
    //get the path to PROJECTS file
    const buffer = fs.readFileSync(
      path.join(__dirname, "../projects/projects.json")
    );
    //stream file content and convert to string so its readable
    const content = buffer.toString();
    //parse string to JSON
    const projectsDB = JSON.parse(content);
    const projects = projectsDB.filter(
      (project) => project.studentId === req.params.id
    );
    if (projects.length > 0) {
      res.send(projects);
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
    check("surname").exists().withMessage("Insert a surname please!"),
    check("dob")
      .isISO8601()
      .withMessage("Date of Birth must be date!")
      .exists()
      .withMessage("Insert Date of Birth Please!"),
    check("email")
      .isEmail()
      .withMessage("Email must be of type email")
      .exists()
      .withMessage("Insert Email Please!"),
    body("email").custom((value) => {
      const data = getFileContent();
      const filtered = data.filter((user) => user.email === value);
      if (filtered.length !== 0) {
        throw new Error("E-mail already in use!");
      }
      return true;
    }),
    body("email").normalizeEmail(),
  ],
  (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error();
        err.message = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const data = getFileContent();
        //create a new user varialble from the req.body
        const newUser = { ...req.body, id: uniqid(), createdAt: new Date() };

        //append the newUser to the existing array
        data.push(newUser);
        //write file by getting the path of the file and stringify the array of data
        fs.writeFileSync(
          path.join(__dirname, "students.json"),
          JSON.stringify(data)
        );

        res.status(201).send(newUser);
      }
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", (req, res, next) => {
  try {
    const data = getFileContent();
    //filter the data to exclude the student with id equal to req.params.id
    const newJson = data.filter((student) => student.id !== req.params.id);
    //write file by getting the path of the file and stringify the array of data
    fs.writeFileSync(
      path.join(__dirname, "students.json"),
      JSON.stringify(newJson)
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  [
    check("name")
      .isLength({ min: 4 })
      .withMessage("No way! Name too short!")
      .exists()
      .withMessage("Insert a name please!"),
    check("surname").exists().withMessage("Insert a surname please!"),
    // check("dob")
    //   .isDate()
    //   .withMessage("Date of Birth must be date!")
    //   .exists()
    //   .withMessage("Insert Date of Birth Please!"),
    check("email")
      .isEmail()
      .withMessage("Email must be of type email")
      .exists()
      .withMessage("Insert Email Please!"),
    body("email").normalizeEmail(),
  ],
  (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error();
        err.message = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
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
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
