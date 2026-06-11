var express = require('express');
var path = require('path');
var ejs = require('ejs');

var app = express();

var dataAccess = require('./data-access/index');

var config = '';
if ('development' == app.get('env')) {
    config = require('./config/env/development');
    console.log("=== Using development environment === ");
} else {
    config = require('./config/env/production');
    console.log("=== Using production environment === ");
}

// all environments
app.set('port', 3000);
app.set('views', path.join(__dirname, 'public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 60000 }));

app.get('/api/sessions', function(req, res) {
    dataAccess.getSessions(function(error, data) {
        if (error) {
            return res.status(500).send(error);
        } else {
            return res.status(200).send(data);
        }
    });
});

app.get('/api/speakers', function(req, res) {
    dataAccess.getSpeakers(function(error, data) {
        if (error) {
            return res.status(500).send(error);
        } else {
            return res.status(200).send(data);
        }
    });
});

app.get('/speakers/:technology/:name', function(req, res) {
    var name = req.params.name,
        technology = req.params.technology;

    res.render('speakerdetails', { name: name, technology: technology });
});

app.get('/speakerdetails/', function(req, res) {
    dataAccess.getSpeakers(function(error, data) {
        if (error) {
            return res.status(500).send(error);
        } else {
            return res.status(200).send(data);
        }
    });
});

app.get('/api/stats', function(req, res) {
    dataAccess.stats(function(error, data) {
        if (error) {
            return res.status(500).send(error);
        } else {
            data.webTaskId = process.pid;
            return res.status(200).send(data);
        }
    });
});

app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});