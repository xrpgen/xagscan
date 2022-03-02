/* global $, CONST, myApp, require */

myApp.controller('SignUpCtrl', ['$scope', '$location', '$http','$timeout','$interval' ,function( $scope ,  $location ,$http, $timeout,$interval ) {
    const url_email_code = "/users/send/email/code";
    const url_reg = "/users/reg";
    const url_check_email = "/users/email/check";
    const msg1 = "Email addres already sign up ";
    let user = {tm:'send'};

    let sendCode = function(user) {
        user.wait = true;
        $http({  
            method:'post',  
            url: url_check_email,  
            data: {"email":user.email} 
        }).then(function successCallback(res) {
                if(res.data) {
                    Msg.error("Error -> " + msg1);
                    user.wait = false;
                    return ;
                }
                send_verify_code(user);
            });

    }
    
    let send_verify_code = function(user) {
        Msg.info("Start send verify code...");
        let i = 300;
        $interval(() => {
            i--;
            user.tm = i;
            if(i==0) {
                user.wait = false;
                user.tm = 'Send';
            }
        },1000,300);
        $http({  
            method:'post',  
            url: url_email_code,  
            data: user 
        }).then(function successCallback(res) {
                if("200" != res.data.code) {
                    Msg.error("Error -> " + res.data.message);
                    user.wait = false;
                    return
                }
                Msg.success("Send sucess find the verify code in your email(在邮箱中获取验证码):" + user.email);
            }, function errorCallback(err) {
                user.wait = false;
                Msg.error("Error -> " + err.data);
        });
    }

    let reg = function(user) {
        $http({  
            method:'post',  
            url: url_reg,  
            data: user 
        }).then(function successCallback(res) {
                if("200" != res.data.code) {
                    Msg.error("Error -> " + res.data.message);
                    return
                }
                let i = 5;
                let v_msg  = Msg.info("");
                $interval(() => {
                    v_msg.update({
                        type: "info",
                        message: "Sign up success wil go to login after "+i+" s"
                      })
                    if(i==0) {
                        $location.path("/login");
                    }
                    i--;
                },1000,6)
                
            }, function errorCallback(err) {
                Msg.error("Error -> " + err.data);
        });
    }
    $scope.user = user;
    $scope.sendCode = sendCode;
    $scope.reg = reg;

}]);
