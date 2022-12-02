const express = require('express');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');

const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

const app = express();
const PORT = 8080; //default port 8080

//configure view engine
app.set('view engine', 'ejs');


////////DATABASE

const urlDatabase = {
  // b2xVn2: {
  //   longURL: "http://www.lighthouselabs.ca",
  //   userID: "userRandomID"
  // },
  // sm5xK9: {
  //   longURL: "http://www.google.com",
  //   userID: "user2RandomID"
  // },
};

const users = {
  // userRandomID: {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "funky1",
  // },
  // user2RandomID: {
  //   id: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "funky2",
  // },
};


////////MIDDLEWARE


//body-parser middleware (Must come before the route, as  will convert the request body from a Buffer into string that we can read. It will then add the data to the req(request) object under the key body)
app.use(express.urlencoded({ extended: true }));


//cookie session
app.use(cookieSession({
  name: 'session',
  keys: ['umsegredosecreto'],
  // cookie Options
  maxAge: 24 * 60 * 60 * 1000 // expiry 24 hours
}))


////////GET

app.get('/', (req, res) => {
  res.send('Hello');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});


//register form
app.get('/register', (req, res) => {
  // retrieve the user's cookie
  const userId = req.session.user_id;
  // check if the user is logged in
  if (userId) {
  return res.redirect('/urls');
  }
  const templateVars = { 
    user: users[userId],
  };
  res.render('urls_register', templateVars);
});


// login form
app.get('/login', (req, res) => {
  // retrieve the user's cookie
  const userId = req.session.user_id;
   // check if the user is logged in
  if (userId) {
   return res.redirect('/urls');
  }
  const templateVars = { 
    user: users[userId]
  };
  res.render('urls_login', templateVars);
});


// urls - main page
app.get('/urls', (req, res) => {
  // retrieve the user's cookie
  const userId = req.session.user_id;
  //console.log(userId); //userRandomID
  // check if the user is logged in
  if (!userId) {
  return res.status(401).send("Access denied. Please Login or Register.");
  }
  //we need to pass along the urlDatabase to the template urls_index
  const templateVars = { 
    user: users[userId],
    urls: urlsForUser(userId, urlDatabase)
  };
  //res 2 arg: EJS path, template
  res.render('urls_index', templateVars);
});


//new url form - routes should be ordered from most specific to least specific, new comes before :id
app.get('/urls/new', (req, res) => {
  // retrieve the user's cookie
  const userId = req.session.user_id;
   // check if the user is logged in
  if (userId) {
    const templateVars = { 
      user: users[userId],
    };
    res.render('urls_new', templateVars);
  } else {
    return res.redirect('/login');
  }
});


//specific url
app.get('/urls/:id', (req, res) => {
  // retrieve the user's cookie
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  // check if id exists
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('No url with provided id in our database.');
  } // check if the user is logged in
  if (!userId) {
  return res.status(401).send("Access denied. Please Login or Register.");
  } if (userId !== urlDatabase[shortURL].userID) {
    return res.status(401).send("Access denied. This URL belongs to another user.");
  }
  
  const templateVars = {
    user: users[userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };

  res.render('urls_show', templateVars);
})


//redirect short URLs to long URLs:
app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('No url with provided id in our database.')
  }
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});



////////POST


//register new user and store in user database
app.post('/register', (req, res) => {
  const id = generateRandomString();
  // pull the email and password off the body object
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  //console.log('hashedPassword', hashedPassword);
  //console.log(req.body); //{ email: 'marcela.ang@gmail.com', password: '1234' }
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send('Valid mail and password required');
  } else if (getUserByEmail(email, users)) {
    res.status(400);
    res.send('Cannot register with an email address that has already been used.') 
  } else {
  // create a new user object
  const user = {
    id,
    email,
    password: hashedPassword
  };
  // add new user to user object
  users[id] = user;

  // add new user id cookie
  req.session.user_id = id;
  
  res.redirect('/urls');
  }
  console.log(users); //confirm new user was added to users object
});


//login 
 app.post('/login', (req, res) => { 
  //console.log('login req body:', req.body); // { email: 'marcela.ang@gmail.com', password: '123456' }

  const email = req.body.email;
  const password = req.body.password;
  const foundUser = getUserByEmail(email, users);

  if (!foundUser) {
    res.status(403);
    res.send('Email cannot be found. Please register.');
  } else if (!bcrypt.compareSync(password, foundUser.password)) {
      res.status(403);
      res.send('Password does not match with the email addess provided.');
    } else {
  // set the cookie
  req.session.user_id = foundUser.id;
  res.redirect('/urls');
  }
});


//logout
 app.post('/logout', (req, res) => { 
  //console.log('req body:', req.body); 

  req.session = null;

  res.redirect('/login');
});


//new url form - route to Receive the Form Submission:
app.post('/urls', (req, res) => {
  //console.log('req.body: ', req.body); // Log the POST request body to the console { longURL: 'www.ikea.ca' }
  // retrieve the user's cookie
  const userId = req.session.user_id;
   // check if the user is logged in
  if (!userId) {
   return res.status(401).send("Only logged in users can shorten URLs. Please Login or Register.");
  }

  const newLongURL = req.body.longURL;
  //console.log('newLongURL: ', newLongURL);

  const newShortURL = generateRandomString();
  //console.log('newShortURL: ', newShortURL);

  // Add new url to DB with generated random string
  urlDatabase[newShortURL] = {
    longURL: newLongURL,
    userID: userId
  }
 console.log('urlDatabase: ', urlDatabase);

  // Use route to view the new url you made!
  res.redirect(`/urls/${newShortURL}`);
  
});


//edit 
app.post('/urls/:id/', (req, res) => {
  
  const userId = req.session.user_id;
  const userURLs = urlsForUser(userId, urlDatabase);
  const shortURL = req.params.id;

    //if id does not exist
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('No url with provided id in our database.');

  //if the user is not logged in
  } if (!userId) {
    return res.status(401).send("Access denied. Please Login or Register.");

  //if the user does not own the URL
  } if (!Object.keys(userURLs).includes(shortURL)) {
    return res.status(401).send("Access denied. This URL belongs to another user.");

  } else {
    const editLongURL = req.body.type;

    //update long url in  database
    urlDatabase[req.params.id].longURL = editLongURL;

    return res.redirect('/urls');
  }
});


//delete
app.post('/urls/:id/delete', (req, res) => {
  const userId = req.session.user_id;
  const userURLs = urlsForUser(userId, urlDatabase);
  const shortURL = req.params.id;

    //if id does not exist
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('No url with provided id in our database.');

  //if the user is not logged in
  } if (!userId) {
    return res.status(401).send("Access denied. Please Login or Register.");

  //if the user does not own the URL
  } if (!Object.keys(userURLs).includes(shortURL)) {
    return res.status(401).send("Access denied. This URL belongs to another user.");

  } else {
  const urlID = req.params.id;

  //remove url from database object
  delete urlDatabase[urlID];

  // redirect to urls_index ('/urls'), otherwise it will keep loading and nothing seems to happen
  return res.redirect('/urls');
  }
});



////////Server Listening...

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});