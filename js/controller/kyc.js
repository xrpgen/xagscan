/* global $, CONST, myApp, require */

myApp.controller('KycCtrl', ['$scope', '$rootScope', '$window', '$location', '$http', '$timeout','AuthenticationFactory', function( $scope ,  $rootScope , $window , $location , $http, $timeout, AuthenticationFactory ) {
    let url_kyc = "/users/api/kyc";
    let url_kyc_submit = "/users/api/kyc/submit";
    let url_kyc_eth_set = "/users/api/kyc/wallet/eth/set";
    let url_kyc_xlm_set = "/users/api/kyc/wallet/xlm/set";
    let url_kyc_xrp_set = "/users/api/kyc/wallet/xrp/set";

    let kyc = {};
    Msg.info("Start loading Kyc ...");
    $http({  
        method:'post',  
        url: url_kyc
    }).then(function successCallback(res) {
            if(res.data.code == '200') {
                let v_user = res.data.data;
                if(!v_user){ Msg.success("Loading successfully. No Information");return;}
                v_user.birth_date = new Date(v_user.birth_date);
                $scope.kyc = v_user;
                if(v_user.status==1) {
                    Msg.success("Your KYC is approved update your ETH address OR XLM address if not yet.");
                }else if(v_user.status==2) {
                    Msg.error("Your KYC is rejected due to => "+ v_user.remark);
                }else{
                    Msg.info("Your KYC is waiting approve, contact us if over 48h")
                }
            }
        });

    let submitKyc = function(kyc) {
        //console.log("kycinfo",kyc);
        Msg.info("Start submit KYC information please wait...");
        var form = new FormData(document.getElementById("kycForm"));
        $http({  
            method:'post',  
            url: url_kyc_submit,
            data: form,
            headers : {'Content-Type':undefined}
        }).then(function successCallback(res) {
                if(res.data.code == '200') {
                    //$scope.kyc = res.data.data;
                    Msg.success("Submit kyc successfully check status in 24 hours. -ζδΊ€ζε");
                    $scope.kyc.status=0;

                }else{
                    Msg.error("Submit kyc error -> " + res.data.message);
                }
            }, function errorCallback(err) {
                Msg.error("Error => " + err.data);
             });
    }

    let submitETHAddress = function(kyc) {
        Msg.info("Start submit ETH address...");
        $http({  
            method:'post',  
            url: url_kyc_eth_set,
            data: {'id':kyc.id,'eth_pubkey':kyc.eth_pubkey}
        }).then(function successCallback(res) {
                if(res.data.code == '200') {
                    Msg.success("Successfully submited ETH Address - ζδΊ€ζε");
                }else{
                    Msg.error("Submit ETH Address error." + res.data.message);
                }
            }, function errorCallback(err) {
                Msg.error("Error => " + err.data);
             });
    }
    let submitXLMAddress = function(kyc) {
        Msg.info("Start submit Stellar address...");
        $http({  
            method:'post',  
            url: url_kyc_xlm_set,
            data: {'id':kyc.id,'xlm_pubkey':kyc.xlm_pubkey}
        }).then(function successCallback(res) {
                if(res.data.code == '200') {
                    Msg.success("Successfully submited Stellar(XLM) Address-ζδΊ€ζε");
                }else{
                    Msg.error("Submit Stellar(XLM) Address error." + res.data.message);
                }
            }, function errorCallback(err) {
                Msg.error("Error => " + err.data);
             });
    }

    let submitXRPAddress = function(kyc) {
        Msg.info("Start submit Ripple address...");
        $http({  
            method:'post',  
            url: url_kyc_xrp_set,
            data: {'id':kyc.id,'xrp_pubkey':kyc.xrp_pubkey}
        }).then(function successCallback(res) {
                if(res.data.code == '200') {
                    Msg.success("Successfully submited Ripple(XRP) Address-ζδΊ€ζε");
                }else{
                    Msg.error("Submit Ripple(XRP) Address error." + res.data.message);
                }
            }, function errorCallback(err) {
                Msg.error("Error => " + err.data);
             });
    }

    
    $scope.kyc = kyc;
    $scope.submitKyc = submitKyc;
    $scope.submitETHAddress = submitETHAddress;
    $scope.submitXLMAddress = submitXLMAddress;
    $scope.submitXRPAddress = submitXRPAddress;

}]);



var isIE = /msie/i.test(navigator.userAgent) && !window.opera; 
function fileChange(target,id) { 
var fileSize = 0; 
var filetypes =[".jpg",".png",".jpeg",".txt",".bmp"]; 
var filepath = target.value; 
var filemaxsize = 4096;//2M 
if(filepath){ 
var isnext = false; 
var fileend = filepath.substring(filepath.indexOf(".")); 
if(filetypes && filetypes.length>0){ 
for(var i =0; i<filetypes.length;i++){ 
if(filetypes[i]==fileend){ 
isnext = true; 
break; 
} 
} 
} 
if(!isnext){ 
alert("File Type Error δΈζ₯εζ­€ζδ»Άη±»εοΌ"); 
target.value =""; 
return false; 
} 
}else{ 
return false; 
} 
if (isIE && !target.files) { 
var filePath = target.value; 
var fileSystem = new ActiveXObject("Scripting.FileSystemObject"); 
if(!fileSystem.FileExists(filePath)){ 
alert("ιδ»ΆδΈε­ε¨οΌθ―·ιζ°θΎε₯οΌ"); 
return false; 
} 
var file = fileSystem.GetFile (filePath); 
fileSize = file.Size; 
} else { 
fileSize = target.files[0].size; 
} 
 
var size = fileSize / 1024; 
if(size>filemaxsize){ 
alert("File too large ιδ»Άε€§ε°δΈθ½ε€§δΊ"+filemaxsize/1024+"MοΌ"); 
target.value =""; 
return false; 
} 
if(size<=0){ 
alert("ιδ»Άε€§ε°δΈθ½δΈΊ0MοΌ"); 
target.value =""; 
return false; 
} 
} 
