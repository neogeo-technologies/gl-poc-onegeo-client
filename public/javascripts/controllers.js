/* controllers.js */

'use strict';

var polygonStyle = {
    className: 'geojsonFeature',
    color: '#f10f34',
    fillColor: '#f10f34',
    stroke: true,
    opacity: 1,
    fillOpacity: 0.333,
    weight: 2,
    lineCap: 'butt',
    lineJoin: 'round'
};
var highlightedPolygonStyle = {
    className: 'geojsonFeature',
    color: '#f10f34',
    fillColor: '#f10f34',
    stroke: true,
    opacity: 1,
    fillOpacity: 0.333,
    weight: 4,
    lineCap: 'butt',
    lineJoin: 'round'
};
var selectedPolygonStyle = {
    className: 'geojsonFeature',
    color: '#0fa5f1',
    fillColor: '#0fa5f1',
    stroke: true,
    opacity: 1,
    fillOpacity: 0.333,
    weight: 4,
    lineCap: 'butt',
    lineJoin: 'round'
};
var lineStyle = {
    className: 'geojsonFeature',
    color: '#f10f34',
    stroke: true,
    opacity: 1,
    weight: 2,
    lineCap: 'butt',
    lineJoin: 'round'
};
var highlightedLineStyle = {
    className: 'geojsonFeature',
    color: '#f10f34',
    stroke: true,
    opacity: 1,
    weight: 4,
    lineCap: 'butt',
    lineJoin: 'round'
};
var selectedLineStyle = {
    className: 'geojsonFeature',
    color: '#0fa5f1',
    stroke: true,
    opacity: 1,
    weight: 4,
    lineCap: 'butt',
    lineJoin: 'round'
};
var pointStyle = {
    className: 'geojsonFeature',
    color: '#f10f34',
    fillColor: '#f10f34',
    stroke: true,
    opacity: 1,
    fillOpacity: 0.333,
    weight: 2,
    radius: 4
};
var highlightedPointStyle = {
    className: 'geojsonFeature',
    color: '#f10f34',
    fillColor: '#f10f34',
    stroke: true,
    opacity: 1,
    fillOpacity: 0.333,
    weight: 4,
    radius: 8
};
var selectedPointStyle = {
    className: 'geojsonFeature',
    color: '#0fa5f1',
    fillColor: '#0fa5f1',
    stroke: true,
    opacity: 1,
    fillOpacity: 0.333,
    weight: 4,
    radius: 8
};

function style (feature) {
    if (!(['LineString'].indexOf(feature.geometry.type) === -1)) {
        return lineStyle;
    };
    if (!(['Polygon', 'MultiPolygon'].indexOf(feature.geometry.type) === -1)) {
        return polygonStyle;
    };
};

function pointToLayer (feature, latlon) {
    return L.circleMarker(latlon, pointStyle);
};

Onegeo.controller('onegeoIndexCtrl', [
    '$scope',
    '$location',
    '$timeout',
    '$window',
    function ($scope, $location, $timeout, $window) {

        $scope.$location = $location;
        $scope.$window = $window;

        $scope.lookIn = function (num) {
            if (isEmpty($scope.textQuery)) { // Not needed if using ngDisabled.
                return;
            };
            if (num === 0) {
                $scope.$location.path('search').search('txt', $scope.textQuery);
            };
            if (num === 1) {
                $scope.$location.path('map').search('txt', $scope.textQuery);
            };
            $scope.$location.replace();
            $scope.$window.location.href = $scope.$location.absUrl();
        };
    }
]);

Onegeo.controller('onegeoMainCtrl', [
    'onegeoFactory',
    '$scope',
    '$route',
    '$location',
    '$timeout',
    '$window',
    function (results, $scope, $route, $location, $timeout, $window) {

        $scope.$route = $route;
        $scope.$location = $location;
        $scope.$window = $window;

        $scope.params = params;
        $scope.textQuery = params.txt;

        $scope.currentPage = ((sze + idx) / sze) - (((sze + idx) / sze) % 1);
        $scope.itemsPerPage = sze;

        $scope.onInit = function () {
            if ($scope.textQuery) {
                return proceed();
            };
        };

        $scope.onClickOnegeoLink = function () {
            $scope.$location.path('/');
            $scope.$window.location.href = $scope.$location.path();
        };

        $scope.onClickButtonSearchSubmit = function () {
            if ($scope.textQuery) {
                return proceed({emptyBuckets: true});
            };
        };

        $scope.onEnterInputSearchText = function () {
            if ($scope.textQuery) {
                return proceed({emptyBuckets: true});
            };
        };

        var timeOut;
        $scope.onChangeInputSearchText = function () {
            if (timeOut) {
                $timeout.cancel(timeOut);
            };
            timeOut = $timeout(function () {
                timeOut = null;
                return proceed({emptyBuckets: true});
            }, 777);
        };

        $scope.onPageChanges = function (num) {
            if ($scope.textQuery) {
                $scope.currentPage = (num) ? num : $scope.currentPage;
                return proceed();
            };
        };

        $scope.onFilterChange = function () {
            if ($scope.textQuery) {
                return proceed();
            };
        };

        $scope.switchTheInterface = function (num) {
            var path = (num === 0) ? 'search' : 'map';
            $scope.$location.path(path).search($scope.params);
            $scope.$window.location.href = $scope.$location.absUrl();
        };

        $scope.highlightResult = function (json) {
            /* VERY UGLY => TODO */
            var result = '';
            var lst = [];
            for (var key in json) {
                var parent = key.split('.')[0];
                if (parent === 'tags') {
                    var tags = '<em>' + json[key].join(', ') + '</em>';
                    result += '<p>' + tags + '</p>';
                }
                else {
                    var child = key.split('.')[1];
                    var str = '<samp>' + child + '</samp> : <span>' + json[key].join('...') + '</span>';
                    lst.push(str);
                };
            };
            return result += lst.join('<br />');
        };

        $scope.getSuggests = function (value) {
            return results.search(value).then(function (a) {
                return a.suggests;
            });
        };

        var proceed = function (options) {

            if (options && options.emptyBuckets) {
                $scope.buckets = [];
            };

            $scope.results = [];
            idx = ($scope.currentPage * sze) - sze;

            $scope.filters = {};
            if ($scope.buckets) {
                for (var bucket in $scope.buckets) {
                    $scope.filters[$scope.buckets[bucket].field] = [];
                    for (var tag in $scope.buckets[bucket].tags) {
                        if ($scope.buckets[bucket].tags[tag].isChecked == true) {
                            $scope.buckets[bucket].isChecked = true;
                            $scope.filters[$scope.buckets[bucket].field].push($scope.buckets[bucket].tags[tag].name);
                        };
                    };
                };
            };
            $scope.loadResults();
        };

        $scope.loadResults = function () {/* This function is to extend. */};
    }
]);

Onegeo.controller('onegeoSearchCtrl', [
    'onegeoFactory',
    '$scope',
    '$route',
    '$location',
    '$timeout',
    '$window',
    '$controller',
    function (results, $scope, $route, $location, $timeout, $window, $controller) {

        // Initialize onegeoMainCtrl and extend it
        angular.extend(this, $controller('onegeoMainCtrl', {$scope: $scope}));

        // Initialize the overview map
        $scope.overviewMap = new L.map('map-overview', {
            attributionControl: true,
            boxZoom: false,
            dragging: false,
            doubleClickZoom: false,
            keyboard: false,
            scrollWheelZoom: false,
            tap: false,
            touchZoom: false,
            zoomControl: false,
            minZoom: 1,
            maxZoom: 17
        })
        .setView([0, 0], 0) // Ugly!
        .addLayer(new L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
            subdomains: '1234',
            attribution: '&copy; <a href=\'http://www.openstreetmap.org/\'>OpenStreetMap</a> and contributors, under an <a href=\'http://www.openstreetmap.org/copyright\' title=\'ODbL\'>open license</a>. Tiles Courtesy of <a href=\'http://www.mapquest.com/\'>MapQuest</a> <img src=\'http://developer.mapquest.com/content/osm/mq_logo.png\'>'
        }));

        $scope.loadResults = function () {
            // Perform a search.
            results.search($scope.textQuery, $scope.filters).then(function (resp) {
                $scope.params = resp.params;
                $scope.time = resp.time;
                $scope.count = resp.count;
                $scope.resultsLabel = ($scope.count >= 1) ? 'résultats' : 'résultat';

                if ($scope.count == 0) {
                    return;
                };

                $scope.results = resp.results;
                for (var i = 0; i < $scope.results.length; i ++) {
                    // Add a counter for radio buttons:
                    $scope.results[i].resultId = i;
                };

                if (isEmpty($scope.buckets)) {
                    $scope.buckets = resp.aggs;
                    //$scope.filterDisableddisabled = !$scope.filterDisableddisabled;
                };

                for (var i = 0; i < $scope.buckets.length; i++) { // Ugly..
                    $scope.buckets[i].bucketId = i;
                    $scope.buckets[i].isChecked = false;
                    if ($scope.buckets[i].field === 'source.title') {
                        $scope.buckets[i].title = 'Jeu de données';
                    };
                };

                // Then show the first result
                $scope.selectedResultItem = 0;
                $scope.showResultItem($scope.results[$scope.selectedResultItem].this);
            });
        };

        $scope.showResultItem = function (feature) {

            $scope.feature = feature;

            if ($scope.layer) {
                $scope.overviewMap.removeLayer($scope.layer);
            };
            // Set GeoJSON layer:
            $scope.layer = L.geoJson([feature], {
                style: style,
                pointToLayer: pointToLayer
            });
            // Add the GeoJSON layer to the map:
            $scope.overviewMap.addLayer($scope.layer);
            // Then fit the map extent:
            $scope.overviewMap.fitBounds($scope.layer.getBounds(), {padding: [20, 20]});
            // Display GeoJSON properties => UGLY
            angular.element(document.getElementById('ft-properties')).html(jsonToList(feature.properties).outerHTML);
        };

        /* Result item events */

        $scope.onChangeResultItem = function (feature) {
            $scope.showResultItem(feature);
        };
    }
]);

Onegeo.controller('onegeoMapCtrl', [
    'onegeoFactory',
    '$scope',
    '$route',
    '$location',
    '$timeout',
    '$window',
    '$controller',
    '$anchorScroll',
    function (results, $scope, $route, $location, $timeout, $window, $controller, $anchorScroll) {

        // Initialize onegeoMainCtrl and extend it:
        angular.extend(this, $controller('onegeoMainCtrl', {$scope: $scope}));

        $scope.toggleSideBar = function (event) {
            event.preventDefault();
            angular.element(document.querySelector('#wrapper')).toggleClass('toggled')
            angular.element(document.querySelector('#sidebar-toggle')).toggleClass('toggled');
        };

        // Initialize the Leaflet map:
        $scope.map = new L.map('map', {
            attributionControl: true,
            boxZoom: false,
            dragging: true,
            doubleClickZoom: true,
            keyboard: false,
            scrollWheelZoom: true,
            tap: true,
            touchZoom: true,
            zoomControl: false
        })
        .addControl(new L.control.zoom({position: 'bottomright'}))
        .addLayer(new L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
            subdomains: '1234',
            attribution: '&copy; <a href=\'http://www.openstreetmap.org/\'>OpenStreetMap</a> and contributors, under an <a href=\'http://www.openstreetmap.org/copyright\' title=\'ODbL\'>open license</a>. Tiles Courtesy of <a href=\'http://www.mapquest.com/\'>MapQuest</a> <img src=\'http://developer.mapquest.com/content/osm/mq_logo.png\'>'
        }));

        // Init the GeoJSON layer:
        $scope.layer = new L.geoJson();

        function getPointOnFeature (feature) {
            // Return any point from given feature:
            var point = turf.pointOnSurface(feature);
            return L.point(point.geometry.coordinates[1], point.geometry.coordinates[0]);
        };

        function openThePopup (layer, point) {
            // Open popup which contains feature properties:
            var content = jsonToList(layer.feature.properties); // Ugly!
            var popup = L.popup({closeOnClick: false}).setContent(content.outerHTML);
            if (point) {
                layer.bindPopup(popup).openPopup(L.latLng(point.x, point.y));
            }
            else {
                layer.bindPopup(popup).openPopup();
            };
        };

        //
        var selectedLayer;

        function selectLayer (layer) {
            if (!(['Polygon', 'MultiPolygon'].indexOf(layer.feature.geometry.type) === -1)) {
                layer.setStyle(selectedPolygonStyle);
            };
            if (!(['LineString', 'MultiLineString'].indexOf(layer.feature.geometry.type) === -1)) {
                layer.setStyle(selectedLineStyle);
            };
            if (!(['Point', 'MultiPoint'].indexOf(layer.feature.geometry.type) === -1)) {
                layer.setStyle(selectedPointStyle);
            };
            selectedLayer = layer;
        };

        function unselectLayer (layer) {
            $scope.layer.resetStyle(layer);
            if (layer === selectedLayer) {
                selectedLayer = null;
            };
        };

        //
        var highlightedLayer;

        function highlightLayer (layer) {
            if (!(['Polygon', 'MultiPolygon'].indexOf(layer.feature.geometry.type) === -1)) {
                layer.setStyle(highlightedPolygonStyle);
            };
            if (!(['LineString', 'MultiLineString'].indexOf(layer.feature.geometry.type) === -1)) {
                layer.setStyle(highlightedLineStyle);
            };
            if (!(['Point', 'MultiPoint'].indexOf(layer.feature.geometry.type) === -1)) {
                layer.setStyle(highlightedPointStyle);
            };
            highlightedLayer = layer;
        };

        function downlightLayer (layer) {
            $scope.layer.resetStyle(layer);
            if (layer === highlightedLayer) {
                highlightedLayer = null;
            };
        };

        $scope.loadResults = function () {

            // Empty variables:
            selectedLayer = null;
            highlightedLayer = null;

            // Clean the map:
            $scope.map.closePopup();
            $scope.map.removeLayer($scope.layer);

            // Perform a search:
            results.search($scope.textQuery, $scope.filters).then(function (resp) {

                $scope.params = resp.params;
                $scope.time = resp.time;
                $scope.count = resp.count;
                $scope.resultsLabel = ($scope.count >= 1) ? 'résultats' : 'résultat';

                if ($scope.count == 0) {
                    return;
                };

                $scope.results = resp.results;

                var geojsonList = [];
                for (var i = 0; i < $scope.results.length; i ++) {
                    // Add a counter for radio buttons:
                    $scope.results[i].resultId = $scope.results[i].this.resultId = i + 1;
                    // Fill the GeoJSON list:
                    geojsonList.push($scope.results[i].this);
                };
                // Set GeoJSON layer:
                $scope.layer = L.geoJson(geojsonList, {
                    style: style,
                    pointToLayer: pointToLayer,
                    onEachFeature: function (feature, layer) {
                        layer.on({
                            click: onClick,
                            mouseover: onMouseOver,
                            mouseout: onMouseOut
                        });
                    }
                });
                // Add the GeoJSON layer to the map:
                $scope.map.addLayer($scope.layer);
                // Then fit the map extent:
                $scope.map.fitBounds($scope.layer.getBounds());
            });
        };

        /* Layer events */

        function onClick (event) {
            var layer = event.target;
            if (selectedLayer) {
                unselectLayer(selectedLayer);
            };
            selectLayer(layer);
            openThePopup(layer);
            $scope.map.panTo(layer.getBounds().getCenter());
            // Select the search result item:
            $scope.selectedResultItem = layer.feature.resultId;
            // Scroll to html element:
            $scope.$location.hash('result-' + layer.feature.resultId);
            $anchorScroll();
            // Force refresh:
            $scope.$apply();
        };

        function onMouseOver (event) {
            var layer = event.target;
            highlightLayer(layer);
        };

        function onMouseOut (event) {
            var layer = event.target;
            if (selectedLayer && layer === selectedLayer) {
                return;
            }
            else if (highlightedLayer) {
                downlightLayer(highlightedLayer);
            };
        };

        /* Result item events */

        $scope.onMouseEnterResultItem = function (feature) {
            $scope.map.eachLayer(function (layer) {
                if (layer.feature) {
                    if (layer.feature.resultId === feature.resultId) {
                        if (selectedLayer && !(selectedLayer === layer)) {
                            highlightLayer(layer);
                        };
                    };
                };
            });
        };

        $scope.onMouseLeaveResultItem = function (feature) {
            $scope.map.eachLayer(function (layer) {
                if (layer.feature) {
                    if (layer.feature.resultId === feature.resultId) {
                        if (selectedLayer && !(selectedLayer === layer)) {
                            downlightLayer(layer);
                        };
                    };
                };
            });
        };

        $scope.onChangeResultItem = function (feature) {
            $scope.map.closePopup();
            $scope.map.eachLayer(function (layer) {
                if (layer.feature) {
                    if (layer.feature.resultId === feature.resultId) {
                        if (selectedLayer) {
                            unselectLayer(selectedLayer);
                        };
                        selectLayer(layer);
                        openThePopup(layer, getPointOnFeature(layer.feature));
                        $scope.map.fitBounds($scope.layer.getBounds()).panTo(layer.getBounds().getCenter());
                    };
                };
            });
        };

        $scope.onDblClickResultItem = function (feature) {
            $scope.map.closePopup();
            $scope.map.eachLayer(function (layer) {
                if (layer.feature) {
                    if (layer.feature.resultId === feature.resultId) {
                        if (selectedLayer) {
                            unselectLayer(selectedLayer);
                        };
                        selectLayer(layer);
                        openThePopup(layer, getPointOnFeature(layer.feature));
                        $scope.map.fitBounds(layer.getBounds());
                    };
                };
            });
        };

        $scope.onRightClickResultItem = function () {
            if (selectedLayer) {
                unselectLayer(selectedLayer);
                $scope.map.closePopup();
                $scope.map.fitBounds($scope.layer.getBounds());
                // Unselect radio button:
                $scope.selectedResultItem = null;
            };
        };

    }
]);
