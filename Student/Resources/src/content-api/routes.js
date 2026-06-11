'use strict';

var db = require('./db');
var sessionsJson = require('./sessions');
var speakersJson = require('./speakers');

var counters = {
    stats: 0,
    speakers: 0,
    sessions: 0
};

function stats() {
    return {
        taskId: process.pid,
        hostName: process.env.HOSTNAME,
        pid: process.pid,
        mem: process.memoryUsage(),
        counters: counters,
        uptime: process.uptime(),
        dataSource: db.isConnected() ? 'postgresql' : 'json'
    };
}

async function sessionsGet(req, res, next) {
    counters.sessions++;
    try {
        var data = db.isConnected() ? await db.getSessions() : sessionsJson;
        res.json(data);
    } catch (err) {
        next(err);
    }
}

async function speakersGet(req, res, next) {
    counters.speakers++;
    try {
        var data = db.isConnected() ? await db.getSpeakers() : speakersJson;
        res.json(data);
    } catch (err) {
        next(err);
    }
}

function statsGet(req, res) {
    counters.stats++;
    res.json(stats());
}

var init = function(app) {
    app.get("/sessions", sessionsGet);
    app.get("/speakers", speakersGet);
    app.get("/stats", statsGet);
    app.get("/", function(req, res) {
        res.status(200).send("");
    });
};

module.exports = init;