class GroupDialog {
  constructor($scope) {}  
}

function GroupDialogFactory($scope, $mdDialog, mode, parent, ev) {
  let controller;
  if(mode === "create") {
    controller = CreateGroupDialog;
  }
  else if(mode === "edit") {
    controller = EditGroupDialog;
  }
  else {
    throw new Error("Illigal dialog mode: " + mode);
  }
  
  parent = parent instanceof Element ? angular.element(parent) : parent;
  $mdDialog.show({
    controller: controller,
    templateUrl: 'GroupDialog.html',
    parent: parent,
    targetEvent: ev,
    clickOutsideToClose: true,
    preserveScope: true,
    scope: $scope.$new()
  });
}

class CreateGroupDialog extends GroupDialog {
  constructor($scope) {
    super($scope);
    
    $scope.name     = "";
    $scope.password = "";
    $scope.type     = "coffee";
    $scope.message  = "";
    
    $scope.action   = "Create";
    $scope.title    = "Create Group";
    
    $scope.submit = () => {
      var options = {
        name: $scope.name,
        password: $scope.password || undefined,
        type: $scope.type || undefined,
        message: $scope.message || undefined
      };
      
      console.log("Create Channel", options);
      createChannel(options)
        .then($scope.hideDialog.bind($scope))
        .then($scope.updateGroupsBinding.bind($scope))
        .catch($scope.handleFetchError.bind($scope));
    };
  }
}

class EditGroupDialog extends GroupDialog {
  constructor($scope) {
    super($scope);
    $scope.name     = $scope.$parent.activeGroup.name;
    $scope.password = "";
    $scope.type     = $scope.$parent.activeGroup.type;
    $scope.message  = $scope.$parent.activeGroup.message;
    
    $scope.action   = "Save Changes";
    $scope.title    = "Update Group";
    
    $scope.submit = () => {
      var options = {
        name: $scope.name,
        password: $scope.password || undefined,
        type: $scope.type || undefined,
        message: $scope.message || undefined
      };
      $scope.createGroup = {};
      
      console.log("Create Channel", options);
      updateChannel($scope.$parent.activeGroup.id, options)
        .then($scope.hideDialog.bind($scope))
        .then($scope.updateGroupsBinding.bind($scope))
        .then($scope.activateGroup.bind($scope, $scope.$parent.activeGroup.id, true))
        .catch($scope.handleFetchError.bind($scope));
    };
  }
}