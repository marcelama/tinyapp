// check if the email submitted already exists
const getUserByEmail = function(email, users) {
  let foundUser = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      foundUser = user;
      //console.log(foundUser) // { id: 'user2RandomID', email: 'user2@example.com', password: 'dishwasher-funk'}
      return foundUser;
    }
  }
  return undefined;
};

module.exports = { getUserByEmail };