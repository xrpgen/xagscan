/* global myApp */

myApp.controller("FooterCtrl", [ '$scope', '$translate','$location', 'SettingFactory','AuthenticationFactory',function( $scope ,  $translate , $location,  SettingFactory,AuthenticationFactory  ) {
 
    $scope.changeLanguage = function (key) {
      $translate.use(key);
      SettingFactory.setLang(key);
    };
    
  }]);
