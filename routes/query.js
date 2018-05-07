/* routes/query.js */

var _ = require('underscore');
// var elasticsearch = require('elasticsearch');
var express = require('express');
var extend = require('extend');
var Q = require('q');
var request = require('request');

var router = express.Router();

var conf = require('./conf.json');

function search(textQuery, startIndex, sizeResponse, highlighted, aggregation, service) {
    // Performs a ElasticSearch request then returns response into a promise.
    var deferred = Q.defer();

    if (service == '_all') {
        service = conf.all_service;
    };
    var uri = service + '?_through';

    var query = {
        from: startIndex,
        size: sizeResponse,
        query: {
            bool: {
                must: {
                    multi_match: {
                        fields: ['properties.*'],
                        fuzziness: 'auto',
                        query: textQuery
                    }
                }
            }
        }
    };

    query.suggest = {
        text: textQuery,
        suggest: {
            phrase: {
                // analyzer: 'custom_uax_analyzer',
                field: '_all',
                size : 1,
                real_word_error_likelihood: 0.95,
                max_errors: 0.5,
                gram_size: 2,
                direct_generator: [{
                    field: '_all',
                    suggest_mode: 'always',
                    min_word_length: 1
                }],
                highlight: {
                  pre_tag: '<em>',
                  post_tag: '</em>'
                }
            }
        }
    };

    if (highlighted) {
        query.highlight = {
            // require_field_match: false,
            fields: {
                'properties.*': {
                    // type: 'plain'
                    // force_source: true,
                    // order: 'score',
                    post_tags: ['</strong>'],
                    pre_tags: ['<strong>'],
                    type: 'plain'
                }
            }
        }
    };

    if (aggregation) {

        for (var i = 0; i < aggregation.length; i ++) {
            // `<field1>=<tag1>,<tag2>,<tag3>;<field2>=<tag4>;<field3>`
            var field = aggregation[i].replace(/([\w\.]+)(\=([^\;]+\,?)+)?/gi, '$1');
            query.aggs = extend(query.aggs, {});
            query.aggs[field] = {
                terms: {
                    field: field,
                    size: 5, // returns top ten..
                    // shard_size: 0,
                }
            };
            var tags = aggregation[i].match(/[^\=\,]+/gi).slice(1);
            if (tags.length != 0) {
                var terms = [];
                for (var j = 0; j < tags.length; j ++) {
                    var term = {};
                    term[field] = {value: tags[j]};
                    terms.push({term: term});
                };
                query.query.filtered.filter = {or: terms};
            };
        };
    };

    request({
        method: 'POST',
        uri: uri,
        body: JSON.stringify(query)
    }, function (error, response, body) {

        if (response.statusCode != 200) {
            return deferred.reject;
        };

        body = JSON.parse(body)

        var hitsIn = (body.hits || {}).hits || [];
        var hitsOut = [];
        for (var i = 0; i < hitsIn.length; i ++) {
            var hitIn = hitsIn[i];
            hitIn.highlight = (function (properties, highlight) {
                var obj1 = {};
                for (var property in properties) {
                    var obj2 = {};
                    obj2['properties.' + property] = [properties[property]];
                    extend(true, obj1, obj2);
                };
                return extend(obj1, highlight);
            } (hitsIn[i]._source.preview, hitsIn[i].highlight));
            hitsOut.push(hitIn);
        };

        var aggregations = [];
        for (var k in body.aggregations) {
            var agg = {};
            var buckets = [];
            for (var i=0; i<body.aggregations[k].buckets.length; i++) {
                aggregation = {
                    name: body.aggregations[k].buckets[i].key,
                    count: body.aggregations[k].buckets[i].doc_count
                }
                buckets.push(aggregation);
            };
            agg = {
                field: k,
                tags: buckets
            };
            aggregations.push(agg);
        };

        var suggests = [];
        // for (var i = 0; i < body.suggest.suggest.length; i ++) {
        //     var suggest = body.suggest.suggest[i];
        //     if (!(suggest === undefined)) {
        //         var options = [];
        //         if (!(suggest.options === undefined)) {
        //             for (var j = 0; j < suggest.options.length; j ++) {
        //                 options.push(suggest.options[j].text);
        //             };
         //         };
        //     };
        //     suggests.push(options);
        // };

        deferred.resolve({
            time: (body.took / 1000) % 60, // convert ms in s
            count: body.hits.total,
            suggests: (function (arr) {
                var res = [];
                for (var i = 0; i < arr.length; i ++) {
                    res.push(arr[i].join(' '));
                };
                return res
            })(_.unzip(suggests)),
            results: hitsOut,
            aggregations: aggregations
        });

    });

    return deferred.promise;
};


router.get('/', function (req, res, next) {

    var textQuery = req.query.txt;

    if (!textQuery) {
        res.status(400).send('Bad Request');
    };

    startIndex = (typeof req.query.idx !== 'undefined') ? req.query.idx : 0;
    sizeResponse = (typeof req.query.sze !== 'undefined') ? req.query.sze : 10;
    aggregation = (typeof req.query.aggs !== 'undefined') ? req.query.aggs.match(/[\w\.]+(\=([^\;]+\,?)+)?/gi) : null;
    highlighted = (typeof req.query.hilited !== 'undefined') ? true : false;
    service = (typeof req.query.hilited !== 'undefined') ? req.query.service : '_all';

    search(textQuery, startIndex, sizeResponse, highlighted, aggregation, service).then(function (a) {

        var results = [];
        for (var i = 0; i < a.results.length; i ++) {
            for (var field in a.results[i]._source.fields) {
                if ('properties.' + field in a.results[i].highlight) {
                    a.results[i].highlight['properties.' + a.results[i]._source.fields[field]] = a.results[i].highlight['properties.' + field];
                    delete a.results[i].highlight['properties.' + field];
                };
                if (field in a.results[i]._source.properties) {
                    a.results[i]._source.properties[a.results[i]._source.fields[field]] = a.results[i]._source.properties[field];
                    delete a.results[i]._source.properties[field];
                };
            };
            results.push({
                this: a.results[i]._source,
                that: a.results[i].highlight
            });
        };

        res.json({
            results: results,
            stat: {
                time: a.time,
                count: a.count,
                aggs: a.aggregations
            },
            suggests: a.suggests
        });
    });
});

module.exports = router;
