const express = require("express");
const path = require("path");
const cors = require("cors");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

// Create user api
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    const createUserQuery = `
        INSERT INTO user(username, name, password, gender, location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );
        `;

    await db.run(createUserQuery);
    response.send("User Created Successfully");
  } else {
    response.status(400);
    response.send("User already Exists");
  }
});

// login user api

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  const dbUser = await db.get(selectUserQuery);

  //   console.log(dbUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatched === true) {
      response.send("Login Success");
      //   console.log(response);
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

// Get Users api

app.get("/users/", async (request, response) => {
  const selectUsersQuery = `SELECT * FROM user;`;

  const allUsers = await db.all(selectUsersQuery);

  response.send(allUsers);
});

// Inserting Data

// app.post("/data/", async (request, response) => {
//   const { userDetails } = request.body;
//   //   console.log(id);

//   const insertDataQuery = `
//         INSERT INTO data(userId, id, title, body)
//         VALUES(
//             ${userId},
//             ${id},
//             '${title}',
//             '${body}'
//         );
//         `;

//   await db.run(insertDataQuery);
//   response.send("Data inserted successfully");
// });

app.post("/data/", async (request, response) => {
  const userDetails = request.body;

  //   console.log(userDetails);

  const values = userDetails.map(
    (eachUser) =>
      `(${eachUser.userId}, ${eachUser.id}, '${eachUser.title}', '${eachUser.body}')`
  );

  const valuesString = values.join(",");
  //   console.log(valuesString);

  const addUserQuery = `
   INSERT INTO data(userId, id, title, body)
   VALUES
       ${valuesString};`;

  const dbResponse = await db.run(addUserQuery);
  const bookId = await dbResponse.lastID;
  response.send({ userId: bookId });
});

//  "userId":1,
//     "id":12,
//     "title": "QWERTY",
//     "body":"hyderabad fj ljafje f.aefjhae fb,bhfha kjefhurhf"

// Get Users Data

app.get("/data/", async (request, response) => {
  const getSelectUsersQuery = `
    SELECT * FROM data;
    `;

  const allUsers = await db.all(getSelectUsersQuery);
  response.send(allUsers);
});
