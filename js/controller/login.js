/* global $, CONST, myApp, require */

myApp.controller('LoginCtrl', ['$scope',  '$window', '$location','$http','$interval' , 'AuthenticationFactory', function( $scope  , $window,  $location , $http, $interval, AuthenticationFactory ) {
    let url_login = "/users/login";
    let user = {};
    let login = function(user) {
        user.msg = {};
        $http({  
            method:'post',  
            url: url_login,  
            data: user 
        }).then(function successCallback(res) {
                if("200" != res.data.code) {
                   // user.msg.err = res.data.message;
                   Msg.error("login error." + res.data.message);
                    return
                }
                AuthenticationFactory.create(res.data.data);
                $location.path("/kyc");
                
                
            }, function errorCallback(err) {
                //user.msg.err = err.data;
                Msg.success("login error ->" + err.data);
        });
    }

    $scope.user = user;
    $scope.login = login;
}]);
