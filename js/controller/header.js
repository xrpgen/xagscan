/* global myApp */

myApp.controller("HeaderCtrl", ['$scope','$translate','$route', '$window', '$rootScope', '$location', 'SettingFactory', 'AuthenticationFactory',  function( $scope ,  $translate,  $route, $window,  $rootScope ,  $location ,  SettingFactory,  AuthenticationFactory ,  StellarApi ) {

    $scope.goto = function(sc_input) {
      if(sc_input.startsWith('r')) {
        $location.path("/account").search({"data":sc_input});
        //$rootScope.goTo('/account?address=sc_input');
      }else{
        $location.path('/tx').search({"data":sc_input});
      }
    }

    $scope.isActive = function(route) {
      return route === $location.path();
    }
    //$scope.launched = $window.localStorage['launched'] ? true : false;

    $scope.logout = function () {
      AuthenticationFactory.logout();
      $location.path("/login");
      $rootScope.reset();
    }

    $scope.reload = function() {
      $route.reload();
    }

    $scope.changeLanguage = function (key) {
      $translate.use(key);
      SettingFactory.setLang(key);
    };

  }
]);
