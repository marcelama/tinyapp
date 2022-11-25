const express = require('express');

const app = express();
const PORT = 8080; //default port 8080
app.set('view engine', 'ejs');

const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

////////////////////////////////////////////////////////////////
////Middleware
////////////////////////////////////////////////////////////////

//body-parser middleware (Must come before the route, as  will convert the request body from a Buffer into string that we can read. It will then add the data to the req(request) object under the key body)
app.use(express.urlencoded({ extended: true }));



////////////////////////////////////////////////////////////////
////Routes
////////////////////////////////////////////////////////////////
app.get('/', (req, res) => {
  res.send('Hello');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

//we need to pass along the urlDatabase to the template urls_index
//2 arg: EJS path, template
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

/**
 * CREATE
 */

//NEW FORM SHOW - routes should be ordered from most specific to least specific, new comes before :id
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

//NEW URL FORM SUBMISSION - POST Route to Receive the Form Submission:
app.post("/urls", (req, res) => {
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


app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render('urls_show', templateVars);
});

// Redirect Short URLs to long URLs:
app.get("/u/:id", (req, res) => {
  
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});



////////////////////////////////////////////////////////////////
////Server Listening...
////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

