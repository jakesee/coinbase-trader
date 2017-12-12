var coinbot = angular.module('coinbot', []);

coinbot.controller('PhoneListController', ($scope, socket) => {

    socket.on('price.update', (spot) => {
        $scope.prices = spot;
        $scope.$apply();
        console.log($scope.prices);
    });
});

coinbot.factory('socket', ($rootScope) => {
    var socket = io.connect();

    return {
        on: function(event, action) {
        socket.on(event, action);
        },

        emit: function(event, message) {
            socket.emit(event, message);
        },
    }
});


