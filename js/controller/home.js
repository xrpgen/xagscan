/* global myApp, round */

myApp.controller("HomeCtrl", ['$scope', '$rootScope', function( $scope,  $rootScope) {

    $scope.fullReload = function() {
      return location.reload();
    }
    let ledgers = [];
    let drops = "";
    connectionPool.on('ledger', function (idx) {
      connectionPool.send({
        command: 'ledger',
        ledger_index:"validated",
        transactions:true
      }, {
        serverTimeout: 1500,
        overallTimeout: 10000
      }).then(data => {
        console.log('ledger', data);
        let ledger = data.response.ledger;
        if(drops){
          ledger.destroy = drops - ledger.total_coins;
        }
        drops = ledger.total_coins;

        let close_time = (ledger.close_time + 0x386D4380) * 1000;
        ledger.close_time = close_time;
        ledgers.unshift(ledger);
        for(let ld of ledgers) {
          ld.time = moment(ld.close_time).fromNow(true);
        }
        $scope.ledgers = ledgers;
        $scope.$apply();
      }).catch(error => {

        console.log('Error', error.message)
      });
    })

  }]);

