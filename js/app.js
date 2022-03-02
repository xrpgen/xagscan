/* globals angular, gateways, nw, translate_cn, translate_en, translate_fr, */
/* exported myApp */
var myApp = angular.module('myApp', ['ngRoute', 'pascalprecht.translate']);

myApp.config(function($routeProvider, $httpProvider, $translateProvider, $locationProvider) {
  $translateProvider.translations('en', translate_en);
  $translateProvider.preferredLanguage('en');
  $translateProvider.useSanitizeValueStrategy('escape');

  $httpProvider.interceptors.push('TokenInterceptor');

  $routeProvider.when('/', {
    templateUrl : 'pages/home.html',
    controller : 'HomeCtrl'
  }).when('/account', {
    templateUrl : 'pages/exp/account.html',
    controller : 'AccountCtrl',
    access : {
      requiredLogin : false
    }
  }).when('/tx', {
    templateUrl : 'pages/exp/tx.html',
    controller : 'TxCtrl',
    access : {
      requiredLogin : false
    }
  }).otherwise({
      redirectTo : '/'
  });
});

myApp.run(['$rootScope', '$window', '$location', '$translate', 'AuthenticationFactory','SettingFactory',
  function($rootScope, $window, $location, $translate, AuthenticationFactory, SettingFactory) {

    $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
      //console.log("root change",currentRoute);
      if ((nextRoute.access && nextRoute.access.requiredLogin) && !AuthenticationFactory.isInSession) {
        //console.log("need auth go to path",nextRoute);
        $location.path("/login");
      } else {
        // check if user object exists else fetch it. This is incase of a page refresh
        if(AuthenticationFactory.isInSession) AuthenticationFactory.restore();
      }
    });

    $rootScope.$on('$routeChangeSuccess', function(event, nextRoute, currentRoute) {
      //console.log("routeChangeSuccess");
      $rootScope.showMenu = AuthenticationFactory.isInSession;
      // if the user is already logged in, take him to the home page
      if (AuthenticationFactory.isInSession && $location.path() == '/login') {
         $location.path('/');
      }
    });

    $rootScope.$on('$authUpdate', function(){
      console.log('$authUpdate', AuthenticationFactory.isInSession);
    });
  
    $rootScope.goToWithParams = function(url,params){
      $location.path(url).search({"data":params});
    };

    $rootScope.goTo = function(url){
      $location.path(url);
    };

    function reset() {
      console.warn('reset');
     // $rootScope.fed_name = "";
    }

    $rootScope.reset = function(){
      reset();
    }
    $rootScope.isLangCN = function() {
      return SettingFactory.getLang() == 'cn';
    }
    $translate.use(SettingFactory.getLang());
  }]);

/* exported round */
var round = function(dight, howMany) {
  if(howMany) {
    dight = Math.round(dight * Math.pow(10, howMany)) / Math.pow(10, howMany);
  } else {
    dight = Math.round(dight);
  }
  return dight;
}
var Msg = Messenger({'maxMessages':3});
var RippledWsClientPool = require('rippled-ws-client-pool');
var connectionPool = new RippledWsClientPool();
connectionPool.addServer('wss://g1.xrpgen.com');
connectionPool.addServer('wss://g2.xrpgen.com');
connectionPool.addServer('wss://g3.xrpgen.com');
