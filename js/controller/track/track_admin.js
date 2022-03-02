/* global $, CONST, myApp, require */

myApp.controller('TrackAdminCtrl', ['$scope', '$location', '$http','$interval' ,function( $scope ,  $location ,$http, $interval ) {
    //const url_create_wallet = "/track/wallet/create";

    const url_get_wallet = "/track/wallet/";
    const url_get_com_by_id = "/track/com/";
    const url_get_prod = "/track/com/prod/";
    const url_ipfs_upload = "/api/track/ipfs/upload";
    const url_wallet_send = "/track/wallet/send";
    const url = "http://xlmyun.com:666/#!/track?";
    const bass_config = {
        horizonServer : 'https://horizon.stellar.org',
        allowHttp: true
    };
    var server = new StellarSdk.Server(bass_config.horizonServer,{allowHttp: bass_config.allowHttp});
    StellarSdk.Network.usePublicNetwork();
    let wallet_info = {"com_secret":""};
    let com = {};
    let prods = [];
    let record = {
                    "date":"",
                    "time":"",
                    "desc":"",
                    "img":"",
                    "hash":""
                };
    let msg = '';
    /**
     * 
     * @param {*} p_wallet_info 
     * @param {*} p_com 
     * @param {*} p_record 
     * 上传记录到ipfs文件系统 返回hash
     * 流转wallt token 到 root 地址 meme 填入hash
     */
    let  send = function(p_wallet_info, p_com, p_record) {
        //console.log(p_wallet_info);
        //console.log(p_com);
        //console.log(p_record);
 
        $scope.msg = '正在上传记录到IPFS';
        $http({  
            method:'post',
            url: url_ipfs_upload,
            data:{"record":p_record}
        }).then(function successCallback(res) {
                if("200" != res.data.code) {
                    $scope.msg = '记录上传失败，请重试。'+res.data.message;
                    return
                }
                let data = res.data.data;
                $scope.msg = '记录上传成功HASH: ' + data +', 准备上Stelalr链...';
                console.log('ipfs hash',data);
                p_record.hash = data;
                _sendPayment(p_wallet_info, p_record.hash);
  
                
            }, function errorCallback(err) {
                $scope.msg = '记录上传失败，请重试。';
        })
        //p_record.hash = 'b558c63f7590e87507cc46d7a29242722db09421dd60fd6e51bd61b5a676886d';
       //  _sendPayment2(p_wallet_info, p_record.hash);
       //_sendPayment(p_wallet_info, p_record.hash);
  
    }
    /**
     * 
     */
    let _sendPayment2 = function(p_wallet_info, p_hash) {
        $http({  
            method:'post',
            url: url_wallet_send,
            data:{"from_secret":p_wallet_info.com_secret,
                 "to_pubkey":p_wallet_info.root_key,
                "token":p_wallet_info.token,
                "issuer":p_wallet_info.root_key,
                "memo":p_hash,
                "amount":"1"}
        }).then(function successCallback(res) {
                if("200" != res.data.code) {
                    $scope.msg = '上链失败，请重新点击提交';
                }
                $scope.msg = '上链成功，请查看结果';
                let data = res.data.data;
                console.log('send return:',data);
                
                $('#code').qrcode(url+"v_issuer="+p_wallet_info.root_key+"&v_asset_code="+p_wallet_info.token+"&v_from="+p_wallet_info.com_key);
            }, function errorCallback(err) {
                $scope.msg = '上链失败，请重新点击提交';
        })
    }
    let _sendPayment = function(p_wallet_info, p_hash) {
        let fromPair = StellarSdk.Keypair.fromSecret(p_wallet_info.com_secret);
        server.loadAccount(fromPair.publicKey())
        .then(account => {
            let dest = p_wallet_info.root_key;
            var transaction  = new StellarSdk.TransactionBuilder(account)
             .addOperation(StellarSdk.Operation.payment({
                destination: dest,
                amount: "1",
                asset: new StellarSdk.Asset(p_wallet_info.token,dest)
            }))
            .addMemo(StellarSdk.Memo.hash(p_hash))
            .build();
            // Sign the transaction to prove you are actually the person sending it.
            transaction.sign(fromPair);

            return transaction;
        })
        .then(transaction => {
            return server.submitTransaction(transaction);
        })
        .then(data => {
            $scope.msg = '上链成功，请查看结果';
            
            console.log(data);
            $('#code').qrcode(url+"v_issuer="+p_wallet_info.root_key+"&v_asset_code="+p_wallet_info.token+"&v_from="+p_wallet_info.com_key);
            $scope.$apply();
        })
        .catch(err => {
            $scope.msg = '上链失败，请重新点击提交';
            console.log(err);
            $scope.$apply();
        })
        
        
    }

    let  getKeyPairFromSecret = function(wallet_info) {
        
        let v_secret = wallet_info.com_secret;
        if(!v_secret){
            return;
        }
        let keypair = StellarSdk.Keypair.fromSecret(v_secret);
        if(!!keypair) {
            wallet_info.com_key=keypair.publicKey();
            $http({  
                method:'post',  
                url: url_get_wallet+wallet_info.com_key
            }).then(function successCallback(res) {
                    if("200" != res.data.code) {
                        Msg.error("Error -> " + res.data.message);
                        user.wait = false;
                        return
                    }
                    let data = res.data.data;
                    console.log('wallet info',data);
                    wallet_info.tk_com_id = data.tk_com_id;
                    wallet_info.root_key = data.root_key;
                    getComById(wallet_info);
                    getPordByComId(wallet_info);
                }, function errorCallback(err) {
                    Msg.error("Error -> " + err.data);
            })
        }
       
    }

    let getComById = function(wallet_info) {
        $http({  
            method:'post',  
            url: url_get_com_by_id+wallet_info.tk_com_id
        }).then(function successCallback(res) {
                if("200" != res.data.code) {
                    Msg.error("Error -> " + res.data.message);
                    user.wait = false;
                    return
                }
                let data = res.data.data;
                console.log('com info',data);
                $scope.com = data;
                
            }, function errorCallback(err) {
                Msg.error("Error -> " + err.data);
        })
    }
  
    let getPordByComId = function(wallet_info) {
        $http({  
            method:'post',  
            url: url_get_prod+wallet_info.tk_com_id
        }).then(function successCallback(res) {
                if("200" != res.data.code) {
                    Msg.error("Error -> " + res.data.message);
                    user.wait = false;
                    return
                }
                let data = res.data.data;
                console.log('prod info',data);
                $scope.prods = data;
                
            }, function errorCallback(err) {
                Msg.error("Error -> " + err.data);
        })
    }

    function toBase64(files){
        var file = files[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(theFile) {
            imagedata = theFile.target.result;  //base64编码,用一个变量存储
           // console.log(imagedata);
            $scope.record.img = imagedata;
        };
    }

    $scope.toBase64 = toBase64;
    $scope.wallet_info = wallet_info;
    $scope.com = com;
    $scope.prods = prods;
    $scope.record = record;
    $scope.getKeyPairFromSecret = getKeyPairFromSecret;
    $scope.send = send;
    $scope.msg = msg;
    

}]);
