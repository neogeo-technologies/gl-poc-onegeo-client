/* routes/search.js */

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('search', {
        title: 'OneGeo',
        params: req.query
    });
});

module.exports = router;
