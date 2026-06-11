'use strict';
var contentApiUrl = process.env.CONTENT_API_URL;

function getSessions(cb) {
    fetch(contentApiUrl + '/sessions')
        .then(function(res) {
            return res.json();
        })
        .then(function(data) {
            cb(null, data);
        })
        .catch(function(err) {
            cb(err);
        });
}

function getSpeakers(cb) {
    fetch(contentApiUrl + '/speakers')
        .then(function(res) {
            return res.json();
        })
        .then(function(data) {
            cb(null, data);
        })
        .catch(function(err) {
            cb(err);
        });
}

function stats(cb) {
    fetch(contentApiUrl + '/stats')
        .then(function(res) {
            return res.json();
        })
        .then(function(data) {
            cb(null, data);
        })
        .catch(function(err) {
            cb(err);
        });
}

module.exports = {
    getSessions: getSessions,
    getSpeakers: getSpeakers,
    stats: stats
};
