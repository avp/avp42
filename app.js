var express = require('express');
var _ = require('lodash');
var path = require('path');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var hbs = require('hbs');
var db = require('./util/db');
var MongoStore = require('connect-mongo')(session);

passport.use(new LocalStrategy(function(username, password, done) {
  db.checkLogin(username, password, function(err, user) {
    if (err) {
      return done(err);
    }

    if (!user) {
      return done(null, false, {message: 'Incorrect Login.'});
    }

    return done(null, user);
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  db.findUserById(id, function(err, user) {
    if (err) {
      return console.error(err);
    }
    done(null, user);
  })
});

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: 'flying squirrel',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    db: 'avp42'
  })
}));

app.use(passport.initialize());
app.use(passport.session());

hbs.registerPartials(__dirname + '/views/partials');

app.use('/puzzle', require('./puzzle'));

app.get('/', function(req, res) {
  db.getUsers(function(users) {
    res.render('index.hbs', {
      currentUser: req.user,
      users: _.chain(users).map(function(user) {
        return { id: user._id, username: user.username, level: user.level };
      }).sortBy('level').reverse().value()
    });
  });
});

app.get('/login', function(req, res) {
  res.render('login.hbs');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/puzzle',
  failureRedirect: '/login'
}), function(req, res, next) {
});

app.get('/register', function(req, res) {
  res.render('register.hbs', {
    params: req.query
  });
});

app.post('/register', function(req, res) {
  db.createUser(req.body.username, req.body.password, function(err, user) {
    if (!user) {
      return res.redirect('/register?failed=true&reason=username');
    }
    req.login(user, function(err) {
      if (err) {
        console.error(err);
        return res.redirect('/login');
      }
      return res.redirect('/puzzle');
    });
  });
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(3000);

module.exports = app;
