/* global $, CONST, myApp, require */

myApp.controller('TxCtrl', ['$scope', '$location', '$http','$timeout','$interval' ,function( $scope ,  $location ,$http) {

    console.log("start in tx contr");
    let account = [];

    let params = $location.search();
    let hash = params.data;
    var isReady = false;
    function launchApp () {
        connectionPool.send({
            command: 'tx',
            transaction: hash
          }).then(data => {
            console.log('tx', data)
            $scope.tx = data.response;
            let time = data.response.date;
            let date = new Date((time + 0x386D4380) * 1000).toLocaleString()
            $scope.date = date;
            let meta = data.response.meta;
            let delivered_amount =  meta.delivered_amount;
            if(delivered_amount&&delivered_amount.currency) {
                delivered_amount.currency = fmtCode(delivered_amount.currency);
                $scope.currency = delivered_amount.currency;
                $scope.delivered_amount = delivered_amount.value;
                $scope.issuer = delivered_amount.issuer;
            }else if(delivered_amount){
                $scope.currency = 'XAG';
                $scope.delivered_amount =  delivered_amount/1000000;
            }
            if(data.response.Amount.currency) {
                data.response.Amount.currency = fmtCode(data.response.Amount.currency);
                $scope.Amount = data.response.Amount;
            }else{
                $scope.Amount = data.response.Amount/1000000;
            }
            $scope.$apply();
          }).catch(error => {
            Msg.error("Hash error ->" + error.message);
            console.log('Error', error.message)
          });
    }
    connectionPool.on('ledger', function (l) {
        console.log('TxCtrl Ledger closed: ' + l);
        if (!isReady) {
          isReady = true;
          launchApp();
        }
      })
    $scope.account = account;

}]);
