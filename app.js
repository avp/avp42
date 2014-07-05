var express = require('express');
var _ = require('lodash');
var path = require('path');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var db = require('./util/db');

passport.use(new LocalStrategy(function(username, password, done) {
  db.checkLogin(username, password, function(err, user) {
    if (err) {
      console.log('err');
      return done(err);
    }

    if (!user) {
      console.log('incorrect');
      return done(null, false, {message: 'Incorrect Login.'});
    }

    console.log('done');
    return done(null, user);
  });
}));

passport.serializeUser(function(user, done) {
  console.log('serializing');
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  db.findUserById(id, function(err, user) {
    if (err) {
      return console.error(err);
    }
    console.log('deserializing', user);
    done(null, user);
  })
});

var auth = require('./util/auth');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser());
app.use(session({secret: 'flying squirrel'}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res) {
  console.log(req.isAuthenticated(), req.user);
  db.getUsers(function(users) {
    res.render('index.jade', {currentUser: req.user, users: _.map(users, function(user) {
      return {
        id: user._id,
        username: user.username,
        level: user.level
      };
    })});
  });
});

app.get('/login', function(req, res) {
  console.log(req.isAuthenticated(), req.user);
  res.render('login.jade');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}), function(req, res, next) { });

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(3000);

module.exports = app;
