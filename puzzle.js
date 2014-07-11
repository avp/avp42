var express = require('express');
var router = express.Router();
var _ = require('lodash');
var hbs = require('hbs');
var CryptoJS = require('cryptojs').Crypto;

var levels = require('./levels');
var db = require('./util/db');

hbs.registerPartials(__dirname + '/views/partials');

router.get('/', function(req, res) {
  if (req.user) {
    res.redirect('/puzzle/' + levels[req.user.level - 1].answer);
  } else {
    res.redirect('/puzzle/1');
  }
});

router.get('/:level', function(req, res) {
  if (!req.user) {
    return res.redirect('/');
  }
  var level = _.find(levels, {answer: req.params.level});
  if (!level || level.level + 1 > req.user.level) {
    return res.send(404);
  }
  level = levels[level.level + 1];
  var id = level.level;
  res.render('puzzle/' + id + '.hbs', {
    currentUser: req.user,
    level: levels[id],
    params: req.query,
    showPassword: req.user.level === id
  });
});

router.post('/:id(\\d+)', function(req, res) {
  var id = _.parseInt(req.params.id, 10);
  if (!id || id !== req.user.level) {
    return res.send(404);
  }
  if (CryptoJS.SHA1(req.body.password.toLowerCase().trim()) === levels[id].answer) {
    db.setUserLevel(req.user, id + 1, function(err, user) {
      if (err) {
        throw err;
      }

      req.user = user;
      res.redirect('/puzzle/' + levels[id].answer);
    });
  } else {
    return res.redirect('/puzzle/' + levels[req.user.level - 1].answer + '?failed=true');
  }
});

module.exports = router;
