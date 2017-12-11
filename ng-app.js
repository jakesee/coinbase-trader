var coinbot = angular.module('coinbot', []);

coinbot.controller('PhoneListController', ($scope, socket) => {
    $scope.phones = [{
            name: 'Nexus S',
            snippet: 'Fast just for faster with Nexus S.'
        }, {
            name: 'Motorola XOOM with Wi-Fi',
            snippet: 'The Next, Next Generation tablet.'
        }, {
            name: 'Motorola XOOM',
            snippet: 'The Next, Next Generation tablet.'
        }];



    socket.on('tick', (msg) => {
        $scope.phones.push({
            name: 'tick',
            snippet: msg,
        });
        $scope.$apply();

        console.log( $scope.phones.length);
    });
});

coinbot.factory('socket', ($rootScope) => {
    var socket = io.connect();

    console.log(socket);

    return {
        on: function(event, action) {
        socket.on(event, action);
        },

        emit: function(event, message) {
            socket.emit(event, message);
        },
    }
});


