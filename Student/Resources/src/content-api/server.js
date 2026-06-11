'use strict';

var express = require('express');
var routes = require('./routes');
var db = require('./db');

var app = express();
var port = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler — prints stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler — no stacktrace leaked
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});

db.init()
  .then(function() {
    app.listen(port, function() {
      console.log(`Listening on port ${port}`);
    });
  })
  .catch(function(err) {
    console.error('Failed to initialise database:', err.message);
    process.exit(1);
  });
