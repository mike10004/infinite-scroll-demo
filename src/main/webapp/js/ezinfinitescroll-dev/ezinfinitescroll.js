(function (ng) {
    'use strict';
    var module = ng.module('ezInfiniteScroll', []);

    module.directive('ezInfiniteChild', [function(){
        return {
            require: '^ezInfiniteScroll',
            link: {
                post: function postLink(scope, element, attrs, ezInfiniteScrollCtrl) {
                    console.log('ezInfiniteChild.link');
                    ezInfiniteScrollCtrl.doSomething();
                }
            }
        };
    }]);

    module.directive('ezInfiniteScroll', ['$timeout', function (timeout) {
        return {
            link: function (scope, element, attr) {
                var
                    lengthThreshold = attr.scrollThreshold || 50,
                    timeThreshold = attr.timeThreshold || 400,
                    handler = scope.$eval(attr.ezInfiniteScroll),
                    promise = null,
                    lastRemaining = 9999;

                lengthThreshold = parseInt(lengthThreshold, 10);
                timeThreshold = parseInt(timeThreshold, 10);

                if (!handler || !ng.isFunction(handler)) {
                    handler = ng.noop;
                }

                var maybeInvokeCallback = function () {
                    var
                        remaining = element[0].scrollHeight - (element[0].clientHeight + element[0].scrollTop);

                    //if we have reached the threshold and we scroll down
                    if (remaining < lengthThreshold && (remaining - lastRemaining) < 0) {

                        //if there is already a timer running which has no expired yet we have to cancel it and restart the timer
                        if (promise !== null) {
                            timeout.cancel(promise);
                        }
                        promise = timeout(function () {
                            handler();
                            promise = null;
                        }, timeThreshold);
                    }
                    lastRemaining = remaining;
                };

                element.on('scroll', maybeInvokeCallback);
                maybeInvokeCallback(); // start it off
            },
            controller: [function(){
                console.log('ezInfiniteScroll: controller');
                this.doSomething = function() {
                    console.log('doSomething');
                };
            }]
        };
    }]);
})(angular);