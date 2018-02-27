class JoinDialog {
  constructor($scope) {
    $scope.joinGroup = (group, password) => {
      let promiseGroupId;
      if(group == null){
        promiseGroupId = getChannelByName($scope.searchText)
          .then(res => res.channel.id);
      }
      else {
        promiseGroupId = Promise.resolve(group.id);
      }
      promiseGroupId.then(groupId => subscribeToChannel(groupId, password))
        .then($scope.hideDialog.bind($scope))
        .then($scope.updateGroupsBinding.bind($scope))
        .catch($scope.handleFetchError.bind($scope));
    };
  }  
}

function JoinDialogFactory($scope, $mdDialog, parent, ev, channelId) {
  parent = parent instanceof Element ? angular.element(parent) : parent;
  let scope = $scope.$new();
  scope.searchText = channelId;
  $mdDialog.show({
    controller: JoinDialog,
    templateUrl: 'JoinDialog.html',
    parent: parent,
    targetEvent: ev,
    clickOutsideToClose: true,
    preserveScope: true,
    scope: scope
  });
}