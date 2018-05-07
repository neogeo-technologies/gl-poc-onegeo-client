var Q = require('q');
var request = require('request');
var conf = require('./conf.json');

var utils = {
    getServices: function() {
        var deferred = Q.defer();
        request({
            method: 'GET',
            uri: conf.catalog
        }, function (error, response, body) {
            if (response.statusCode != 200) {
                return deferred.reject;
            };
            body = JSON.parse(body)
            var services = [{
                id: '_all',
                disabled: true,
                label: 'Choisissez un service'
            }];
            for (var i = 0; i < body.length; i ++) {
                services.push({
                    id: body[i].url,
                    label: body[i].url,
                })
            };
            deferred.resolve(services);
        });
        return deferred.promise;
    }
};

module.exports = utils;
