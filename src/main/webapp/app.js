'use strict';

var colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink'];

function createItemsList(numItems) {
    // Returns a random integer between min (included) and max (excluded)
    function randomInt(min, max) {
      if (typeof min === 'undefined' && typeof max === 'undefined') {
          max = 9007199254740991;
          min = -max;
      }
      if (typeof max === 'undefined') {
          max = min;
          min = 0;
      }
      return Math.floor(Math.random() * (max - min)) + min;
    }
    
    var latest = new Date(Date.now());
    var earliest = new Date(latest.getFullYear() - 1, 0, 1);
    
    function randomDate() {
        var min = earliest.getTime();
        var max = latest.getTime();
        var value = randomInt(min, max);
        return new Date(value);
    }
    
    function toHexString(d, padding) {
        var hex = Number(d).toString(16);
        padding = typeof (padding) === "undefined" || padding === null ? padding = 0 : padding;

        while (hex.length < padding) {
            hex = "0" + hex;
        }

        return hex;
    }
    
    numItems = numItems || 1000;
    
    var items = [];
    
    function newItem() {
        return {
            color: colors[randomInt(0, colors.length)],
            id: toHexString(Math.abs(randomInt()), 12) + toHexString(Math.abs(randomInt()), 12) + toHexString(Math.abs(randomInt()), 12),
            timestamp: randomDate()
        };
    }
    
    for (var i = 0; i < numItems; i++) {
        items.push(newItem());
    }
    
    items.sort(function(a, b) {
        return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    return items;
}

angular.module('infiniteScrollDemo', [
  'ngRoute',
  'lrInfiniteScroll',
//    'infinite-scroll',
  'infiniteScrollDemo.filters',
  'infiniteScrollDemo.controllers'
]).
config(['$routeProvider', '$compileProvider', 
    function($routeProvider, $compileProvider) {
        $routeProvider.when('/', {templateUrl: 'view.html', controller: 'MainController'});
        $routeProvider.otherwise({redirectTo: '/'});
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|data):/);
    }
]);

angular.module('infiniteScrollDemo.controllers', [])
  .controller('MainController', ['$scope', '$http', 
    function($scope, $http) {
        $scope.colors = colors;
        $scope.colorOptionsByColor = {};
        $scope.colorOptions = colors.map(function(color){
            var option = {
                color: color,
                selected: true
            };
            $scope.colorOptionsByColor[option.color] = option;
            return option;
        });
        $scope.numItemsToGenerate = 1000;
        $scope.generateItems = function() {
            var items = createItemsList($scope.numItemsToGenerate);
            var json = JSON.stringify(items, null, 2);
            $scope.itemsDataUri = 'data:application/json;base64,' + btoa(json);
        };
        
        $scope.pageSpec = {
            pageStart: 0, 
            pageSize: 5
        };
        $scope.items = [];
        $scope.getNumItems = function() {
            return $scope.items.length;
        };
        $scope.fetchNextItems = function() {
            var pageSpec = angular.copy($scope.pageSpec);
            pageSpec.pageStart += pageSpec.pageSize;
            $scope.pageSpec = pageSpec;
            console.log("fetchNextItems " + JSON.stringify(pageSpec));
            $http.get('items', {
                params: {
                    pageStart: pageSpec.pageStart,
                    pageSize: pageSpec.pageSize
                }
            }).success(function(data){
                data.forEach(function(item){
                    $scope.items.push(item);
                });
            }).error(function(data, status){
                console.warn("fetchNextItems returned error " + status);
                console.info(data);
            });
        };
        
        $scope.filters = {
            byColor: function(item) {
                return $scope.colorOptionsByColor[item.color].selected;
            }
        };
    }
]);

/* Filters */

angular.module('infiniteScrollDemo.filters', [])
  .filter('jsonify', function(){
     return function(value) {
         if (!value) {
             return '';
         }
         return jsonify(value);
     };
  });
