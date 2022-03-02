/* global myApp */

myApp.factory('SettingFactory', function($window) {
  return {
    
    setLang : function(lang) {
      return $window.localStorage['lang'] = lang;
    },
    getLang : function() {
      if ($window.localStorage['lang']) {
        return $window.localStorage['lang'];
      } else {
      //   if (nw.global.navigator.language.indexOf('zh') >= 0) {
      //     return 'cn';
      //   } else if (nw.global.navigator.language.indexOf('fr') >= 0) {
      //     return 'fr';
      //   } else {
        return 'cn';
      // }
      }
    }
  };
});


