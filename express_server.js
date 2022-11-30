const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; //default port 8080

//configure view engine
app.set('view engine', 'ejs');

////////////////////////////////////////////////////////////////
////Helpers functions
////////////////////////////////////////////////////////////////

const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};

// check if the email submitted already exists
const checkEmailExists = function(email) {
  let foundUser = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      foundUser = user;
      //console.log(foundUser) // { id: 'user2RandomID', email: 'user2@example.com', password: 'dishwasher-funk'}
      return foundUser;
    }
  }
  return false;
};
////////////////////////////////////////////////////////////////
////Database
////////////////////////////////////////////////////////////////


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "funky1",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "funky2",
  },
};


////////////////////////////////////////////////////////////////
////Middleware
////////////////////////////////////////////////////////////////

//body-parser middleware (Must come before the route, as  will convert the request body from a Buffer into string that we can read. It will then add the data to the req(request) object under the key body)
app.use(express.urlencoded({ extended: true }));

//cookies
app.use(cookieParser());


////////////////////////////////////////////////////////////////
////Routes
////////////////////////////////////////////////////////////////


/**
 * READ
 */


app.get('/', (req, res) => {
  res.send('Hello');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});


/**
 * REGISTER - POST Route to Receive the Registration Form
 */
app.post('/register', (req, res) => {
  const id = generateRandomString();
  // pull the email and password off the body object
  const email = req.body.email;
  const password = req.body.password;
  //console.log(req.body); //{ email: 'marcela.ang@gmail.com', password: '1234' }
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send('Valid mail and password required');
  } else if (checkEmailExists(email)) {
    res.status(400);
    res.send('Cannot register with an email address that has already been used.') 
  } else {
  // create a new user object
  const user = {id, email, password};
  // add new user to user object
  users[id] = user;

  // add new user id cookie
  res.cookie('user_id', id);
  
  res.redirect('/urls');
  }
  //console.log(users); //confirm new user was added to users object
});

//REGISTER - GET 
app.get('/register', (req, res) => {
  // retrieve the user's cookie
  const userId = req.cookies['user_id'];
  // check if the user is logged in
  if (userId) {
  return res.redirect('/urls');
  }
  const templateVars = { 
    user: users[userId],
  };
  res.render('urls_register', templateVars);
});


/**
 * LOGIN - POST
 */

 app.post('/login', (req, res) => { 
 // console.log('login req body:', req.body); // { email: 'marcela.ang@gmail.com', password: '123456' }

  const email = req.body.email;
  const password = req.body.password;
  const foundUser = checkEmailExists(email);

  if (!foundUser.id) {
    res.status(403);
    res.send('Email cannot be found. Please register.');
  } else if (foundUser.password !== password) {
      res.status(403);
      res.send('Password does not match with the email addess provided.');
    } else {
  // set the cookie
  res.cookie('user_id', foundUser.id);
  res.redirect('/urls');
  }
});

// LOGIN - GET
app.get('/login', (req, res) => {
  // retrieve the user's cookie
  const userId = req.cookies['user_id'];
   // check if the user is logged in
  if (userId) {
   return res.redirect('/urls');
  }
  const templateVars = { 
    user: users[userId]
  };
  res.render('urls_login', templateVars);
});

/**
 * LOGOUT
 */

 app.post('/logout', (req, res) => { 
  //console.log('req body:', req.body); 

  res.clearCookie('user_id');

  res.redirect('/login');
});


//INDEX (ALL URLS)
//we need to pass along the urlDatabase to the template urls_index
//res 2 arg: EJS path, template
app.get('/urls', (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

/**
 * CREATE
 */

//NEW FORM SHOW - routes should be ordered from most specific to least specific, new comes before :id
app.get('/urls/new', (req, res) => {
  // retrieve the user's cookie
  const userId = req.cookies['user_id'];
   // check if the user is logged in
  if (!userId) {
   return res.redirect('/login');
  }
  const templateVars = { 
    user: users[req.cookies['user_id']],
  };
  res.render('urls_new', templateVars);
});

//NEW URL FORM SUBMISSION - POST Route to Receive the Form Submission:
app.post('/urls', (req, res) => {
  // console.log(req.body); // Log the POST request body to the console { longURL: 'www.ikea.ca' }
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
  const longURL = req.body.longURL;

  const newShortURL = generateRandomString();
  //console.log(newShortURL);

  // Add new url to DB with generated random string
  urlDatabase[newShortURL] = longURL;

  // Use route to view the new url you made!
  res.redirect(`/urls/${newShortURL}`);
  
});



//SHOW (INDIVIDUAL URL)
app.get('/urls/:id', (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render('urls_show', templateVars);
});


// Redirect Short URLs to long URLs:
app.get('/u/:id', (req, res) => {
  
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});

/**
 * UPDATE
 */

//edit route will need to use route to identify which shortened url we need to edit
app.post('/urls/:id/', (req, res) => {
  const editLongURL = req.body.type;
  //console.log('req body:', req.body) // { type: 'http://www.lighthouselabs.com.br' }

  //update long url in  database
  urlDatabase[req.params.id] = editLongURL;

  res.redirect('/urls');
});

/**
 * DELETE
 */

app.post('/urls/:id/delete', (req, res) => {
  const urlID = req.params.id;

  //remove url from database object
  delete urlDatabase[urlID];

  // redirect to urls_index ('/urls'), otherwise it will keep loading and nothing seems to happen
  res.redirect('/urls');
});



////////////////////////////////////////////////////////////////
////Server Listening...
////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});