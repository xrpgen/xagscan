/* global $, CONST, myApp, require */

myApp.controller('KycAdminCtrl', ['$scope', '$rootScope', '$window', '$location', '$http', 'AuthenticationFactory', function( $scope ,  $rootScope , $window,  $location,  $http, AuthenticationFactory ) {

    let url_kyc_list = "/admin/api/kyc/list";
    let url_kyc_approve = "/admin/api/kyc/approve";
    let url_kyc_reject = "/admin/api/kyc/reject";
    let url_kyc_submit = "/admin/api/kyc/submit";

    let kyc = {};
    let kycList = [];
    let curr_kyc = {};
    let condition = '';
    let condition2 = {};
    let count={'pass':0, 'reject':0,'wait':0,'all':0}
    let col = 'id_card';

    Msg.info("Start loading Kyc List ...");
    $http({  
        method:'post',  
        url: url_kyc_list
    }).then(function successCallback(res) {
            if(res.data.code == '200') {
                let v_list = res.data.data;
                if(!v_list){ 
                    Msg.success("Loading successfully. No Information");
                }else{
                    $scope.kycList = v_list;
                    Msg.success("Loading successfully.");
                    for(i in v_list){
                        if(v_list[i].status == 0) {
                            count.wait++;
                        }else if(v_list[i].status == 1) {
                            count.pass++;
                        }else if(v_list[i].status == 2) {
                            count.reject++;
                        }
                         count.all++;
                        
                    }
                
                }          
            }
        },function errorCallback(err) {
            Msg.error("Error => " + err.data);
         });
    
    $scope.approve = function(curr_kyc) {
        $http({  
            method:'post',  
            url: url_kyc_approve,
            data:{'id':curr_kyc.id,'remark': curr_kyc.remark}
        }).then(function successCallback(res) {
                if(res.data.code == '200') {
                    Msg.success("Approve successfully. Go next...");   
                    curr_kyc.status=1;      
                }else{
                    Msg.error("Approve Error => " + res.data.message);
                }
            },function errorCallback(err) {
                Msg.error("Error => " + err.data);
             });
    }

    $scope.reject = function(curr_kyc) {
        $http({  
            method:'post',  
            url: url_kyc_reject,
            data:{'id':curr_kyc.id,'remark': curr_kyc.remark}
        }).then(function successCallback(res) {
            if(res.data.code == '200') {
                Msg.success("Reject successfully. Go next...");
                curr_kyc.status=2;
                         
            }else{
                Msg.error("Reject error => " + res.data.message);
            }
            },function errorCallback(err) {
                Msg.error("Error => " + err.data);
             });
    }

    $scope.setKyc = function(kyc) {
        $scope.curr_kyc = kyc;
    }
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
                    Msg.success("Submit kyc successfully check status in 24 hours.");
                    $scope.kyc.status=0;

                }else{
                    Msg.error("Submit kyc error -> " + res.data.message);
                }
            }, function errorCallback(err) {
                Msg.error("Error => " + err.data);
             });
    }

    $scope.kyc = kyc;
    $scope.submitKyc = submitKyc;
    $scope.kycList = kycList;
    $scope.condition = condition;
    $scope.condition2 = condition2;
    $scope.count = count;
    $scope.curr_kyc=curr_kyc;
}]);


var isIE = /msie/i.test(navigator.userAgent) && !window.opera; 
function fileChange(target,id) { 
var fileSize = 0; 
var filetypes =[".jpg",".png",".jpeg",".txt"]; 
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
alert("File Type Error ???????????????????????????"); 
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
alert("????????????????????????????????????"); 
return false; 
} 
var file = fileSystem.GetFile (filePath); 
fileSize = file.Size; 
} else { 
fileSize = target.files[0].size; 
} 
 
var size = fileSize / 1024; 
if(size>filemaxsize){ 
alert("File too large ????????????????????????"+filemaxsize/1024+"M???"); 
target.value =""; 
return false; 
} 
if(size<=0){ 
alert("?????????????????????0M???"); 
target.value =""; 
return false; 
} 
} 
