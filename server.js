require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

client
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL database");
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL database:", err);
  });

//retrieving all employees
app.get("/getemployees", async (request, response) => {
  const select_query = "SELECT * FROM EMPLOYEES;";
  try {
    const result = await client.query(select_query);
    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving users:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

app.get("/getclients", async (request, response) => {
  try {
    const result = await client.query("SELECT * FROM CLIENTS;");
    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving clients:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

app.get("/getdepartments", async (request, response) => {
  try {
    const result = await client.query("SELECT * FROM DEPARTMENTS;");
    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving departments:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

app.get("/getprojects", async (request, response) => {
  try {
    const result = await client.query("SELECT * FROM PROJECTS;");
    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving projects:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

app.get("/getroles", async (request, response) => {
  try {
    const result = await client.query("SELECT * FROM ROLES;");
    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving roles:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

app.get("/gettasks", async (request, response) => {
  try {
    const result = await client.query("SELECT * FROM TASKS;");
    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving tasks:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

//creating a new employee
app.post("/newemployee", async (request, response) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    gender,
    hire_date,
    department_id,
    role_id,
  } = request.body;

  const insert_query =
    "INSERT INTO EMPLOYEES(first_name,last_name,email,phone,gender,hire_date,department_id,role_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8);";
  try {
    await client.query(insert_query, [
      first_name,
      last_name,
      email,
      phone,
      gender,
      hire_date,
      department_id,
      role_id,
    ]);
    response.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

//updating employee details
app.put("/updateEmployee/:id", async (request, response) => {
  const employeeId = request.params.id;
  const {
    first_name,
    last_name,
    email,
    phone,
    gender,
    hire_date,
    department_id,
    role_id,
  } = request.body;

  const query = `
    UPDATE employees
    SET first_name = $1, last_name = $2, email = $3, phone = $4, gender = $5, hire_date = $6, department_id = $7, role_id = $8
    WHERE employee_id = $9;
  `;
  try {
    const result = await client.query(query, [
      first_name,
      last_name,
      email,
      phone,
      gender,
      hire_date,
      department_id,
      role_id,
      employeeId,
    ]);
    response.status(200).json("Employee updated successfully");
  } catch (error) {
    console.error("Error updating employee:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

//update employee gender
app.patch("/updateGender/:id", async (request, response) => {
  const employeeId = request.params.id;
  const { gender } = request.body;

  const query = `
    UPDATE employees
    SET gender = $1
    WHERE employee_id = $2;
  `;
  try {
    const result = await client.query(query, [gender, employeeId]);
    response.status(200).json("Employee gender updated successfully");
  } catch (error) {
    console.error("Error updating employee gender:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

//deleting an employee
app.delete("/deleteemployee/:id", async (request, response) => {
  const employeeId = request.params.id;
  const delete_query = "DELETE FROM EMPLOYEES WHERE employee_id = $1;";
  try {
    await client.query(delete_query, [employeeId]);
    response.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

//getting employee by gender
app.get("/employees", async (req, res) => {
  const { gender } = req.query;

  const getEmployeesQuery = `
    SELECT *
    FROM employees
    WHERE gender = $1;
  `;

  const result = await client.query(getEmployeesQuery, [gender]);

  res.json(result.rows);
});

//joins
//count of employees in each departments (used left join to include departments with zero employees)
app.get("/department/employeescount", async (request, response) => {
  const get_count = `SELECT
	D.DEPARTMENT_NAME,
	COUNT(E.EMPLOYEE_ID) AS WORK_COUNT
  FROM
    DEPARTMENTS D
    LEFT JOIN EMPLOYEES E ON D.DEPARTMENT_ID = E.DEPARTMENT_ID
  GROUP BY
    D.DEPARTMENT_NAME
  ORDER BY
    WORK_COUNT DESC;`;
  try {
    const result = await client.query(get_count);
    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving employee counts:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

//getting employee by id with department, role and task details
app.get("/employee/:id", async (request, response) => {
  const employeeId = request.params.id;
  const getEmployeeQuery = `SELECT
        *
      FROM
        EMPLOYEES AS E
        INNER JOIN DEPARTMENTS AS D ON E.DEPARTMENT_ID = D.DEPARTMENT_ID
        INNER JOIN ROLES AS R ON E.ROLE_ID = R.ROLE_ID
        INNER JOIN TASKS AS T ON E.EMPLOYEE_ID = T.EMPLOYEE_ID
        WHERE E.EMPLOYEE_ID = $1;`;

  try {
    const result = await client.query(getEmployeeQuery, [employeeId]);
    if (result.rows.length === 0) {
      response.status(404).json({ message: "Employee not found" });
    } else {
      response.status(200).json(result.rows);
    }
  } catch (error) {
    console.error("Error retrieving employee:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

//each project client details with project name and employee details
app.get("/project/clientdetails", async (request, response) => {
  const getClientDetailsQuery = `SELECT
      p.project_name,c.client_name,c.phone
    FROM
      PROJECTS P
      INNER JOIN CLIENTS C ON P.CLIENT_ID = C.CLIENT_ID;`;
  try {
    const result = await client.query(getClientDetailsQuery);
    response.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving client details:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

//employees working on each task with task name
app.get("/task/employees", async (request, response) => {
  const getTaskEmployeesQuery = `SELECT
      t.task_name, e.first_name, e.last_name
    FROM
      TASKS T 
      INNER JOIN EMPLOYEES E ON T.EMPLOYEE_ID = E.EMPLOYEE_ID;`;
  try {
    const result = await client.query(getTaskEmployeesQuery);
    response.status(200).json(result.rows);
  } catch (error) {
    response.status(500).json({ message: "Internal server error" });
  }
});
