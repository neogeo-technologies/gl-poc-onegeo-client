var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('map', {
        title: 'OneGeo',
        params: req.query
    });
});

module.exports = router;
