(function (ng) {
    'use strict';

    // https://github.com/angular/angular.js/blob/834d316829afdd0cc6a680f47d4c9b691edcc989/src/Angular.js#L962
    function toBoolean(value) {
      if (typeof value === 'function') {
        value = true;
      } else if (value && value.length !== 0) {
        var v = angular.lowercase("" + value);
        value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
      } else {
        value = false;
      }
      return value;
    }

    var dbg = false;
    var trc = dbg;
    var module = ng.module('ezInfiniteScroll', []);

    module.directive('ezInfiniteChild', [function(){
        return {
            require: '^ezInfiniteScroll',
            link: {
                post: function postLink(scope, element, attrs, ezInfiniteScrollCtrl) {
                    if (trc) console.log('ezInfiniteChild.link.postLink; this.id = ' + attrs.id);
                    var invokeOnSmallerWidth = false, invokeOnSmallerHeight = true;
                    scope.$watch(
                        function () {
                          return {
                              width: element[0].clientWidth,
                              height: element[0].clientHeight
                          };
                        },
                        function (newValue, oldValue) {
                            if (trc) console.log('element ' + attrs.id + ' resized:', oldValue, newValue);
                            var doMaybeInvoke = (invokeOnSmallerHeight && newValue.height < oldValue.height)
                                || (invokeOnSmallerWidth && newValue.width < oldValue.width);
                            if (doMaybeInvoke) {
                                if (trc) console.log("element got smaller; maybe invoking callback...");
                                if (angular.isFunction(ezInfiniteScrollCtrl.maybeInvokeCallback)) {
                                    ezInfiniteScrollCtrl.maybeInvokeCallback(true);
                                } else {
                                    if (dbg) console.log("not even trying maybeInvokeCallback because it's not defined in ezInfiniteScrollCtrl", ezInfiniteScrollCtrl);
                                }
                            }
                        }, true);
                }
            }
        };
    }]);

    module.directive('ezInfiniteScroll', ['$timeout', function (timeout) {

        return {
            scope: {
                callback: '&ezInfiniteScroll',
                stopFlag: '@ezStopFlag',
                rabbitHole: '@ezMaxRepeat'
            },
            link: function (scope, element, attr) {
                var lengthThreshold = attr.scrollThreshold || 50,
                    timeThreshold = attr.timeThreshold || 400,
                    promise = null,
                    lastRemaining = 9999;
                
                var handler = scope.callback;//scope.callbackHolder[scope.callbackName];

                lengthThreshold = parseInt(lengthThreshold, 10);
                timeThreshold = parseInt(timeThreshold, 10);

                if (!handler || !ng.isFunction(handler)) {
                    console.info('ezInfiniteScroll: no callback defined; set '
                      + 'ezInfiniteScroll="something" where something.callback '
                      + 'is defined in parent scope');
                    handler = ng.noop;
                }

                if (ng.isUndefined(scope.rabbitHole) || scope.rabbitHole === '') {
                    scope.rabbitHole = 10;
                }
                scope.rabbitHole = parseInt(scope.rabbitHole);
                if (trc) console.log('max depth =', scope.rabbitHole);
                
                function isStopFlagOn() {
                    var yes = toBoolean(scope.stopFlag);
                    if (trc) console.log("isStopFlagOn:", yes, "scope.stopFlag:", scope.stopFlag);
                    return yes;
                }

                var maybeInvokeCallback = function (doNotRequireScrollDown, depth) {
                    depth = depth || 0;
                    if (trc) console.log("maybeInvokeCallback: at depth = " + depth);
                    var maxDepth = scope.rabbitHole;
                    if (isStopFlagOn()) {
                        if (dbg) console.log("stop flag is on aborting callback invocation");
                        return;
                    }
                    var scrollHeight = element[0].scrollHeight;
                    var clientHeight = element[0].clientHeight;
                    var scrollTop = element[0].scrollTop;
                    var remaining = scrollHeight - (clientHeight + scrollTop);
                    if (dbg) console.log(remaining, "remaining (last = ", lastRemaining,
                            "scrollHeight =", scrollHeight, "clientHeight =",
                            clientHeight, "scrollTop =", scrollTop);
                    //if we have reached the threshold and we scroll down
                    var tmpLastRemaining = lastRemaining;
                    lastRemaining = remaining;
                    if (remaining < lengthThreshold && (doNotRequireScrollDown || ((remaining - tmpLastRemaining) < 0))) {
                        // if there is already a timer running which has not
                        // expired yet, cancel it and restart the timer
                        if (promise !== null) {
                            timeout.cancel(promise);
                        }
                        promise = timeout(function () {
                            if (dbg) console.log('invoking callback');
                            handler();
                            promise = null;
                            if (depth < maxDepth) {
                                maybeInvokeCallback(doNotRequireScrollDown, depth + 1);
                            } else if (trc) console.log("reached max depth", depth, scope.rabbitHole);
                        }, timeThreshold);
                    }
                };
                scope.maybeInvokeCallback = maybeInvokeCallback;
//                if (trc) console.log('ezInfiniteScroll.link: set scope.maybeInvokeCallback =', 
//                angular.isFunction(this.maybeInvokeCallback) ? '<function>' : this.maybeInvokeCallback)
                element.on('scroll', maybeInvokeCallback);
                maybeInvokeCallback(true); // start it off
            },
            controller: ['$scope', function($scope) {
                if (trc) console.log('ezInfiniteScroll.controller');
                var ctrl = this;
                $scope.$watch('maybeInvokeCallback', function(){
                    ctrl.maybeInvokeCallback = $scope.maybeInvokeCallback;
                    if (trc) console.log('ezInfiniteScroll.controller: set this.maybeInvokeCallback = ', 
                        angular.isFunction(ctrl.maybeInvokeCallback) ? '<function>' : ctrl.maybeInvokeCallback);
                });

            }]
        };
    }]);
})(angular);