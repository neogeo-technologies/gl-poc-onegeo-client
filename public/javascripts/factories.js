/* factories.js */

var idx = 0;
var sze = 25;
var hilited = 'true';

Onegeo.factory('onegeoFactory', ['$q', '$http', '$location', function ($q, $http, $location) {

    var search = function (textQuery, filter, service) {

        var deferred = $q.defer();

        var filterDefault = { // Ugly..
            'source.title': []
        };

        var filter = (isEmpty(filter)) ? filterDefault : filter;

        var aggs = [];
        for (var field in filter) {
            aggs.push(field.concat('=').concat(filter[field].join(',')));
        };

        var params = {
            txt: textQuery,
            hilited: hilited,
            idx: idx,
            sze: sze,
            aggs: aggs.join(';'),
            service: service
        };

        $http({
            method: 'GET',
            url: '/query',
            params: params
        })
        .success(function (data, status, headers, config) {
            var aggs = [];
            for (var agg in data.stat.aggs) {
                if (!isEmpty(data.stat.aggs[agg].tags)) {
                    aggs.push(data.stat.aggs[agg]);
                };
            };
            deferred.resolve({
                time: data.stat.time,
                count: data.stat.count,
                params: params,
                results: data.results,
                suggests: data.suggests,
                aggs: aggs
            });
        }, deferred.reject)
        .error(function (data, status, headers, config) {
            // TODO
        });

        $location.search(params).replace();

        return deferred.promise;
    };

    return {
        search: search
    };

}]);
