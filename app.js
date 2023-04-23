const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at: http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBServer();

const checkRequestsQueries = async (request, response, next) => {
  const { search_q, priority, status, category, date } = request.query;
  const { todoId } = request.params;

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formateDate = format(new Date(date), "yyyy-MM-dd");
      //console.log(formateDate, "f");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      //console.log(result, "r");
      //console.log(new Date(), "new");

      const isValidDate = await isValid(result);
      //console.log(isValidDate, "V");
      if (isValidDate === true) {
        request.date = formateDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (error) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;

  next();
};

const checkRequestsBody = (request, response, next) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const { todoId } = request.params;

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatDate = format(new Date(dueDate), "yyyy-MM-dd");
      //console.log(formatDate);
      const result = toDate(new Date(formatDate));
      //console.log(result);
      const isValidDate = isValid(result);
      //console.log(isValidDate);

      if (isValidDate === true) {
        request.dueDate = formatDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (error) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};

//API 1 Get Objects with QueryParameters
app.get("/todos/", checkRequestsQueries, async (request, response) => {
  const {
    search_q = "",
    priority = "",
    status = "",
    category = "",
  } = request.query;

  const getTodosQuery = `SELECT 
                            id, 
                            todo, 
                            priority, 
                            status, 
                            category, 
                            due_date AS dueDate
                          FROM todo
                          WHERE todo LIKE '%${search_q}%'
                          AND priority LIKE '%${priority}%'
                          AND status LIKE '%${status}%'
                          AND category LIKE '%${category}%';`;

  const todoArray = await db.all(getTodosQuery);
  response.send(todoArray);
});

//API 2 Get Single Todo Object
app.get("/todos/:todoId/", checkRequestsQueries, async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT 
                            id,
                            todo, priority,
                            status,
                            category,
                            due_date AS dueDate
                          FROM todo
                            WHERE id = ${todoId};`;
  const todoObject = await db.get(getTodoQuery);
  response.send(todoObject);
});

//APi 3 Date Formate
app.get("/agenda/", checkRequestsQueries, async (request, response) => {
  const { date } = request.query;
  const getDateQuery = `SELECT 
                            id,
                            todo,
                            priority,
                            status,
                            category,
                            due_date AS dueDate
                          FROM todo 
                          WHERE due_date = '${date}';`;
  const resultDateArray = await db.all(getDateQuery);

  if (resultDateArray === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(resultDateArray);
  }
});

//API 4 POST Todo
app.post("/todos/", checkRequestsBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const getPostQuery = `INSERT INTO 
                        todo (id, todo, priority, status, category, due_date)
                        VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
  const postTodoObject = await db.run(getPostQuery);
  response.send("Todo Successfully Added");
});

//API 5 Update Todo
app.put("/todos/:todoId/", checkRequestsBody, async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo
                             WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `UPDATE todo
                        SET status = '${status}',
                            priority = '${priority}',
                            todo = '${todo}',
                            category = '${category}',
                            due_date = '${dueDate}'
                        WHERE id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 6 Delete Todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo
                        WHERE id = ${todoId};`;
  const deleteTodoObject = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
