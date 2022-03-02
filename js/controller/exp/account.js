/* global $, CONST, myApp, require */

myApp.controller('AccountCtrl', ['$scope', '$location', '$http','$timeout','$interval' ,function( $scope ,  $location ,$http) {

    console.log("start in account contr");
    let account = {};
    let params = $location.search();
    let address = params.data;
    let v_limit = 20;
    console.log(params);
    
    var isReady = false;
    var requests = 0;
    $scope.loadMore=function(marker) {
        console.log(marker);
        connectionPool.send({
            command: 'account_tx',
            account: address,
            ledger_index_min: -1,
            ledger_index_max: -1,
            marker:marker,
            types:["payment"],
            limit:v_limit,
          }, {
            serverTimeout: 1500,
            overallTimeout: 10000
          }).then(data => {
            console.log('account_tx_more', data)
            let transactions = data.response.transactions;
            let payments = [];
            for(let transaction of transactions) {
                let payment = {};
                let tx = transaction.tx;
                let meta = transaction.meta;
                if(tx.TransactionType!="Payment") {
                    continue;
                }
               
                payment.date =  new Date((tx.date + 0x386D4380) * 1000).toLocaleString();
                payment.Account = tx.Account;
                if(tx.Account == address) {
                    payment.inout = 'OUT';
                }else{
                    payment.inout = 'IN';
                }
                payment.Destination = tx.Destination;
                payment.DestinationTag = tx.DestinationTag;
                let delivered_amount =  meta.delivered_amount;
                if(delivered_amount&&delivered_amount.currency) {
                    payment.currency = delivered_amount.currency;
                    payment.delivered_amount = delivered_amount.value;
                    payment.issuer = delivered_amount.issuer;
                }else if(delivered_amount){
                    payment.currency = 'XAG';
                    payment.delivered_amount =  delivered_amount/1000000;
                }
                payment.currency = fmtCode(payment.currency);
                payment.Fee = tx.Fee;
                payment.inLedger = tx.inLedger;
                payment.result = meta.TransactionResult;
                payment.hash = tx.hash;
                payments.push(payment);
            }
            $scope.payments = $scope.payments.concat(payments);
            $scope.marker = data.response.marker;
            $scope.$apply();
          }).catch(error => {
            requests++;
            console.log('Error', error.message)
          });
    }
    function launchApp () {
        requests = 0;
        connectionPool.send({
            command: 'account_info',
            account: address
          }, {
            serverTimeout: 1500,
            overallTimeout: 10000
          }).then(data => {
            requests++;
            console.log('account_info', data)
            $scope.account = data.response.account_data;
            $scope.$apply();
          }).catch(error => {
            Msg.error("Account error ->" + error.message);
            console.log('Error', error.message)
            requests++;
          });

          connectionPool.send({
            command: 'account_lines',
            account: address
          }, {
            serverTimeout: 1500,
            overallTimeout: 10000
          }).then(data => {
            requests++;
            console.log('account_lines', data)
            $scope.trustlines = data.response.lines;
            $scope.trustlines.forEach(line => {
                line.currency = fmtCode(line.currency);
            });
            $scope.$apply();
          }).catch(error => {
            requests++;
            console.log('Error', error.message)
          });

          connectionPool.send({
            command: 'account_tx',
            account: address,
            ledger_index_min: -1,
            ledger_index_max: -1,
            types:["payment"],
            limit:v_limit,
          }, {
            serverTimeout: 1500,
            overallTimeout: 10000
          }).then(data => {
            requests++;
            console.log('account_tx', data)
            let transactions = data.response.transactions;
            let payments = [];
            for(let transaction of transactions) {
                let payment = {};
                let tx = transaction.tx;
                let meta = transaction.meta;
                if(tx.TransactionType!="Payment") {
                    continue;
                }
               
                payment.date =  new Date((tx.date + 0x386D4380) * 1000).toLocaleString();
                payment.Account = tx.Account;
                if(tx.Account == address) {
                    payment.inout = 'OUT';
                }else{
                    payment.inout = 'IN';
                }
                payment.Destination = tx.Destination;
                payment.DestinationTag = tx.DestinationTag;
                let delivered_amount =  meta.delivered_amount;
                if(delivered_amount&&delivered_amount.currency) {
                    payment.currency = delivered_amount.currency;
                    payment.delivered_amount = delivered_amount.value;
                    payment.issuer = delivered_amount.issuer;
                }else if(delivered_amount){
                    payment.currency = 'XAG';
                    payment.delivered_amount =  delivered_amount/1000000;
                }
                payment.currency = fmtCode(payment.currency);
                payment.Fee = tx.Fee;
                payment.inLedger = tx.inLedger;
                payment.result = meta.TransactionResult;
                payment.hash = tx.hash;
                payments.push(payment);
            }
            $scope.payments = payments;
            $scope.marker = data.response.marker;
            $scope.$apply();
          }).catch(error => {
            requests++;
            console.log('Error', error.message)
          });
         
    }

    connectionPool.on('ledger', function (l) {
      console.log('Ledger closed: ' + l);
      if(requests>2){
          //isReady=false;
      }
      if (!isReady) {
        isReady = true;
        launchApp();
      }
    })
    

    //const api = new RippleAPI();
    $scope.account = account;

}]);
