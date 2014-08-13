'use strict';

angular.module('infiniteScrollDemo', [
  'ngRoute',
  'ezInfiniteScroll',
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
        $scope.colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink'];
        $scope.colorOptionsByColor = {};
        $scope.colorOptions = $scope.colors.map(function(color){
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
