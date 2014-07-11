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
var favicon = require('serve-favicon');
var MongoStore = require('connect-mongo')(session);

var levels = require('./levels');

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

app.use(express.static(__dirname + '/public'));
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: process.env['SESSION_SECRET'] || '3b9bb25a307ebbb2f265d77c121d25c2080ca242',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    db: 'avp42'
  })
}));

app.use(passport.initialize());
app.use(passport.session());

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('plusOne', function(x) {
  return x + 1;
});

app.use('/puzzle', require('./puzzle'));

app.get('/', function(req, res) {
  db.getUsers(function(users) {
    res.render('index.hbs', {
      currentUser: req.user,
      users: _.chain(users).map(function(user) {
        return { id: user._id, username: user.username, level: user.level };
      }).filter(function(user) {
        return user.username !== 'avp';
      }).sortBy('level').reverse().value(),
      maxLevel: levels.length - 1
    });
  });
});

app.get('/progress', function(req, res) {
  if (!req.user) {
    return res.redirect('/');
  }
  res.render('progress.hbs', {
    levels: _.filter(levels, function(level) {
      return level.level < req.user.level;
    }).reverse(),
    currentUser: req.user
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
  if (!req.body.username || !req.body.password) {
    return res.redirect('/register');
  }
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

app.listen(3001);

module.exports = app;
