/* global Buffer, angular, myApp */

// Auth - singleton that manages account.
myApp.factory('AuthenticationFactory', ['$rootScope', '$window',function($rootScope ,  $window ) {

  class Auth {

    get SESSION_KEY() { return 'token'; }

    get isInSession() {
      return !!$window.sessionStorage[this.SESSION_KEY];
    }

    create(data){
      $window.sessionStorage[this.SESSION_KEY] = JSON.stringify(data);
    }
    restore() {
      let temp = $window.sessionStorage[this.SESSION_KEY];
      //console.log("current user",temp);
      $rootScope.curr_user = JSON.parse(temp);
    };
    logout() {
      delete $window.sessionStorage[this.SESSION_KEY];
      $rootScope.curr_user = '';
    }

  }

  return new Auth();
}]);


myApp.factory('TokenInterceptor', ($q, $window) => {
  return {
    request: (config) => {
      config.headers = config.headers || {};
      let temp = $window.sessionStorage['token'];
      if (!!temp) {
        temp = JSON.parse(temp);
        config.headers['Authorization'] = temp.token;
      }
      //console.log('TokenInterceptor:request', config);
      return config || $q.when(config);
    },

    response: (response) => {
      return response || $q.when(response);
    }
  };
});

