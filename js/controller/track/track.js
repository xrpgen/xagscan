/* global $, CONST, myApp, require */

myApp.controller('TrackCtrl', ['$scope', '$location', '$http','$timeout','$interval' ,function( $scope ,  $location ,$http) {

    let url_download = "/track/ipfs/download";
    const bass_config = {
        horizonServer : 'https://horizon.stellar.org',
        allowHttp: true
    };
    var server = new StellarSdk.Server(bass_config.horizonServer,{allowHttp: bass_config.allowHttp});

    let tracks = [];
    let msg = "";
    let v_issuer = 'GC5RNNWJV3J7NQ4YBQYRTY4MS7XVATT7T6M3OVM75LXDTCMGNVSEWS54';
    let v_asset_code = 'U919A';
    let v_from = 'GC5NMIWEBNVSVBHHGWBMIK2K5WE2JPONZ4ZMLYY4F6CEYIUPYXZPJSFR';  
    let params = $location.search();
    let filter = ['']
    if(!!params.v_issuer){
         v_issuer = params.v_issuer;
         v_asset_code = params.v_asset_code;
         v_from = params.v_from;
    }

    var lastCursor=0; // or load where you left off
    
    var txHandler = function (txResponse) {
        //console.log(txResponse);
        let track = {};
        track.id = txResponse.id;
        track.memo_type = txResponse.memo_type;
       // StellarSdk.Memo.return(p_hash);
        track.memo = txResponse.memo;
        track.created_at = txResponse.created_at;
        server.payments()
        .forTransaction(track.id)
        .call()
        .then(function (paymentResult) {
            //track.
            let record = paymentResult.records[0];
            //console.log('payment',record);
            if('payment' == record.type && record.asset_code == v_asset_code && record.from==v_from && record.asset_issuer==v_issuer) {
                track.from = record.from;
                track.asset_code = record.asset_code;
                track.asset_issuer = record.asset_issuer;
                return track;
            }
            
        })
        .then( track => {
            //filter
            if(!track || track.memo=='KnS0xbak549ABV5ojWfAIgd027R32Xbcyu9200sWDkY=') {return;}
            //top
            if(track.memo == 'MKGdTHxBDe7RnGgKl16VGd/Idbeby6qjNwcsd7j0VYM=') {
               track.created_at = '0';
            }
            $http({  
                method:'post',
                url: url_download,
                data:{"hash":track.memo}
            }).then(function successCallback(res) {
                    if("200" != res.data.code) {
                       // $scope.msg = '记录上传失败，请重试。';
                        return
                    }
                    track.record = res.data.data;
                    //console.log(track.record);
                    tracks.push(track);
                    if($scope.tracks.length>2) {
                        $scope.tracks = _.sortBy(tracks, function(track) {
                            
                            return track.created_at;
                        })
                        //$scope.$apply();
                    }
                    //$scope.$apply();
                    
                }, function errorCallback(err) {
                    //$scope.msg = '记录上传失败，请重试。';
            })

        })
        .catch(function (err) {
            console.log(err);
        })
    };
    
    
    var es = server.transactions()
        .forAccount(v_issuer)
        .cursor(lastCursor)
        .order("asc")
        .stream({
            onmessage: txHandler
        })


    $scope.tracks = tracks;

}]);
