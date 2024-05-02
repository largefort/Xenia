const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const socketIo = require('socket.io');
const bodyParser = require('body-parser');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/xenia', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Models
const User = require('./models/User.js');
const Game = require('./models/Game.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'xenia secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Incorrect username.' }); }
      if (user.password !== password) {  // Hash in a real application
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const newUser = new User({ username, password, role: 'developer' });
  newUser.save()
    .then(user => res.status(201).send('User registered'))
    .catch(err => res.status(500).send('Error registering user'));
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login'
}));

app.post('/submit-game', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send('You need to log in');
  }
  const { name, genre, iframe } = req.body;
  const newGame = new Game({ developerId: req.user._id, name, genre, iframe });
  newGame.save()
    .then(game => res.status(201).send('Game submitted'))
    .catch(err => res.status(500).send('Error submitting game'));
});

app.get('/my-games', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send('You need to log in');
  }
  Game.find({ developerId: req.user._id })
    .then(games => res.json(games))
    .catch(err => res.status(500).send('Error fetching games'));
});

// WebSocket setup
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
