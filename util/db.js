var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');
var CryptoJS = require('cryptojs').Crypto;

var MONGO_URL = 'mongodb://localhost:27017/avp42';

module.exports.getUsers = function(callback) {
  callback = callback || _.noop;
  MongoClient.connect(MONGO_URL, function(err, db) {
    db.collection('users').find().toArray(function(err, docs) {
      callback(docs);
    });
  });
};

module.exports.findUserById = function(id, callback) {
  MongoClient.connect(MONGO_URL, function(err, db) {
    db.collection('users').findOne({_id: ObjectID(id)}, callback);
  });
};

module.exports.checkLogin = function(username, password, callback) {
  callback = callback || _.noop;
  MongoClient.connect(MONGO_URL, function(err, db) {
    if (err) {
      throw err;
    }
    var hashedPassword = CryptoJS.SHA1(password);
    db.collection('users').findOne({username: username, password: hashedPassword}, function(err, user) {
      console.log(username, hashedPassword, user);
      if (err) {
        callback(err);
      }
      callback(null, user);
    });
  });
};
