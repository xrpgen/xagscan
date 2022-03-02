/* global $, CONST, myApp, require */

myApp.controller('PasswordCtrl', ['$scope', '$location','$http',function( $scope ,  $location , $http ) {

    let url_change_pw = "/users/api/changepw";
    let user = {};
    let changePasswd = function(user) {

        Msg.info("Start changing password...");
        $http({  
            method:'post',  
            url: url_change_pw,
            data: user
        }).then(function successCallback(res) {
                if(res.data.code == '200') {
                    Msg.success("Successfully changed, you can sign out then resign.");
                }else{
                    Msg.error("Changed password error." + res.data.message);
                }
            }, function errorCallback(err) {
                Msg.error("Error => " + err.data);
             });
    }

    $scope.user = user;
    $scope.changePasswd = changePasswd;
}]);
