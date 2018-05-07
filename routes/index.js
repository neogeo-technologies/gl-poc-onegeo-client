var express = require('express');
var router = express.Router();
var utils = require('./utils.js')

router.get('/', function(req, res, next) {
    utils.getServices().then(function (data) {
        res.render('index', {
            title: 'OneGeo',
            catalog: data
            // params: req.query
        });
    });
});

module.exports = router;
