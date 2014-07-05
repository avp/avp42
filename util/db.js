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
    if (err) {
      throw err;
    }
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
      if (err) {
        callback(err);
      }
      callback(null, user);
    });
  });
};

module.exports.createUser = function(username, password, callback) {
  callback = callback || _.noop;
  MongoClient.connect(MONGO_URL, function(err, db) {
    if (err) {
      throw err;
    }
    var hashedPassword = CryptoJS.SHA1(password);
    var collection = db.collection('users');
    collection.findOne({username: username}, function(err, user) {
      if (err) {
        throw err;
      }
      if (user) {
        return callback(null, null);
      }
      collection.insert({
        username: username,
        password: hashedPassword,
        level: 1
      }, function(err, users) {
        if (err) {
          throw err;
        }
        if (!users) {
          return callback(null, null);
        }
        callback(null, {_id: users[0]._id.toString(), username: username, password: password, level: 1});
      });
    });
  });
}

module.exports.setUserLevel = function(user, level, callback) {
  callback = callback || _.noop;
  MongoClient.connect(MONGO_URL, function(err, db) {
    if (err) {
      throw err;
    }
    var collection = db.collection('users');
    collection.findOne({_id: ObjectID(user._id)}, function(err, user) {
      if (err) {
        throw err;
      }
      if (_.isNull(user)) {
        return;
      }
      user.level = level;
      collection.save(user, callback);
    });
  })
};
