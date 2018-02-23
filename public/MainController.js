var coffeeLight = coffeeLight || {};
coffeeLight.size = 0.7;

coffeeLight.loadName = () => {
  name = localStorage.getItem("coffeeLight.name") || "Coffee Lover";
  return name;
};

coffeeLight.changeName = (name) => {
  localStorage.setItem("coffeeLight.name", name);
  changeName(name);
};
  
coffeeLight.setStyle = () => {
  coffeeLight.button = coffeeLight.button || document.getElementById("button");
  coffeeLight.handle = coffeeLight.handle || document.getElementById("handle");
  var parent = coffeeLight.button.parentElement;
  var availableSpace = Math.min(parent.offsetHeight, parent.offsetWidth);
  var diameter = coffeeLight.size * availableSpace;

  coffeeLight.button.style.width  = diameter + "px";
  coffeeLight.button.style.height = diameter + "px";
  coffeeLight.button.style.fontSize = 1.5 * diameter + "%";
  coffeeLight.button.style.borderWidth = 0.04 * diameter + "px";
  coffeeLight.button.style.margin = ((parent.offsetHeight - diameter)/2 + "px") + " " + ((parent.offsetWidth - diameter)/2 + "px");

  if(self.renderer) {
    renderer.setSize( 2*diameter,2*diameter );
    renderer.render( scene, camera );
  }
}

angular
  .module('coffeLight', ['ngMaterial', 'ngMessages'])
  .controller('AppCtrl', function($scope, $timeout, $mdSidenav, $log, $mdDialog, $mdToast) {
  $scope.toggleLeft = buildDelayedToggler('left');

  angular.element(document).ready(function () {
    console.log("ready");
    coffeeLight.setStyle();
  });

  window.onload = () => {
    new ResizeObserver(coffeeLight.setStyle).observe(document.getElementById("buttonContainer"));

    DUMMY_SCENE = new THREE.Scene();
    scene = DUMMY_SCENE;
    camera = new THREE.PerspectiveCamera( 30, 1, 0.1, 1000 );
    camera.position.z = 24;
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    renderer.setClearColor("green",0);
    
    renderer.render( scene, camera );
    
    var b = document.getElementById("button");
    renderer.setSize( b.offsetWidth, b.offsetHeight );
    renderer.domElement.style.top = "0px";
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.transform = "translate(-25%, -25%)";
    b.insertBefore(renderer.domElement, b.firstElementChild);
  };

  window.onhashchange = () => {
    
    var name = window.location.hash.substr(1);
    if(name.length == 0) {
      return;
    }
    
    if($scope.activeGroup && $scope.activeGroup.name == name) {
      return;
    }

    getChannelByName(name).then((res) => {
      var fn = () => {
        $scope.activeGroup   = res.channel;
        $scope.activeGroupId = res.channel.id;
      }
      
      if($scope.$$phase == "$apply") {
        fn();
      }
      else {
        $scope.$apply(fn);
      }
    })
    .catch((e) => {
      if(e instanceof Response) {
        e.json().then((body) => {
          var msg = body.error || "Unkown error"
          $scope.showError(msg);
          $scope.activeGroup = {requestText: msg};
        })
        .catch((ex) => {$scope.showError("Unkown error");});
      }
      else {
        $scope.showError("Unkown error");
      }
    });

  };
  window.onhashchange();

  $scope.name = coffeeLight.loadName();

  $scope.handleFetchError = (res) => {
    if(res.status === 400) {
      return res.json().then(err => $scope.showError(err.error));
    }
    else if(res.text instanceof Function){
      return res.text().then((text) => {
        console.error("Unkowen Request error:", text, res);
        $scope.showError("Unkown error occured");
      });
    }
    else {
      console.error(res);
      $scope.showError("Unkown error occured");
    }
  };

  $scope.showError =  msg => {
    console.error(msg);
    $mdToast.show(
      $mdToast.simple()
      .textContent(msg)
      .hideDelay(3000)
    );
  };

  $scope.buttonClicked = (event, style) => {
    sendNotification($scope.activeGroupId).catch(res => {
      if(res.status === 400) {
        res.json().then((e) => {
          if(e.code == 429) {
            console.log("Notify Rate Limited");
          } else {
            $scope.showError(e.error)
          }
        });
      } else {
        $scope.handleFetchError(res);
      }
    });
    style.animate(renderer, event);
  };

  function loadGroupData(id) {
    getChannel(id).then(result => {
      if(!$scope.activeGroup || result.channel.id != $scope.activeGroup.id) { // in case selection changed until request finished
        $scope.$apply(() => {
          $scope.activeGroup = result.channel;
          console.log($scope.activeGroup);
        });
        window.location.hash = result.channel.name;
      }
    }).catch($scope.handleFetchError.bind($scope));
  }

  $scope.$watch("activeGroupId", (id) => {
    if(id && (!$scope.activeGroup || id != $scope.activeGroup.id) ) {
      loadGroupData(id);
    }
  });

  $scope.$watch("activeGroup.type", (style) => {
    console.log(coffeeLight.styles, style);
    if(style && coffeeLight.styles[style]) {
      scene = coffeeLight.styles[style].getScene();
      document.getElementById("button").style.color = coffeeLight.styles[style].fontColor;
      renderer.render(scene, camera);
      $scope.style = coffeeLight.styles[style];
    }
    else if("DUMMY_SCENE" in window) {
      scene = DUMMY_SCENE;
      document.getElementById("button").style.color = "white";
      renderer.render(scene, camera);
    }
  });


  $scope.groups = [{"name" : "Loading..."}];
  $scope.updateGroupsBinding = function() {
    return getSubscripedChannels().then((groups) => {
      $scope.$apply(() => {
        $scope.groups = groups;
        if(!$scope.activeGroupId && groups.length > 0 && !window.location.hash ) {
          $scope.activeGroupId = groups[0].id;
        }
      }); 
    });
  }
  $scope.updateGroupsBinding();

  $scope.leaveGroup = function(groupid) {
    unsubscribeFromChannel(groupid).then(() => $scope.updateGroupsBinding()).catch($scope.handleFetchError.bind($scope)); 
  };

  $scope.activateGroup = (id, forceRefresh) => {
    $mdSidenav('left').close();
    $scope.activeGroupId = id;
    if(forceRefresh) {
      loadGroupData(id);
    }
  };

  $scope.showSetName = function(ev) {
    var confirm = $mdDialog.prompt()
      .title("What's your name?")
      .placeholder('Name')
      .ariaLabel('Name')
      .initialValue(auth.currentUser ? auth.currentUser.displayName : 'Coffee Lover')
      .targetEvent(ev)
      .ok('Save')
      .cancel('Cancel');

    $mdDialog.show(confirm).then(function(result) {
      coffeeLight.changeName(result);
      $scope.name = coffeeLight.loadName();
    }, function() {
      // ignore
    });
  };

  $scope.searchGroups = query => {
    return searchChannels(query).then(r => r.channels).catch($scope.handleFetchError.bind($scope));
  };

  $scope.showJoinGroup   = JoinDialogFactory.bind(JoinDialogFactory, $scope, $mdDialog, document.getElementById("main"));
  $scope.showCreateGroup = GroupDialogFactory.bind(GroupDialogFactory, $scope, $mdDialog, "create", document.getElementById("main"));
  $scope.showEditDialog  = GroupDialogFactory.bind(GroupDialogFactory, $scope, $mdDialog, "edit"  , document.getElementById("main"));

  $scope.hideDialog = function() {
    $mdDialog.hide();
  };


  function debounce(func, wait, context) {
    var timer;

    return function debounced() {
      var context = $scope, args = Array.prototype.slice.call(arguments);
      $timeout.cancel(timer);
      timer = $timeout(function() {
        timer = undefined;
        func.apply(context, args);
      }, wait || 10);
    };
  }

  function buildDelayedToggler(navID) {
    return debounce(function() {
      $mdSidenav(navID)
        .toggle()
        .then(function() {
            $log.debug("toggle " + navID + " is done");
        });
    }, 200);
  }

  function buildToggler(navID) {
    return function() {
      $mdSidenav(navID)
        .toggle()
        .then(function() {
          $log.debug("toggle " + navID + " is done");
        });
    };
  }
})
.config(function($mdIconProvider, $sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist(["self", "https://raw.githubusercontent.com/google/**"]);
  $mdIconProvider
    .iconSet('navigation', "https://raw.githubusercontent.com/google/material-design-icons/master/sprites/svg-sprite/svg-sprite-navigation.svg", 24)
    .iconSet('editor',     "https://raw.githubusercontent.com/google/material-design-icons/master/sprites/svg-sprite/svg-sprite-editor.svg", 24)
    .iconSet('social',     "https://raw.githubusercontent.com/google/material-design-icons/master/sprites/svg-sprite/svg-sprite-social.svg", 24);
})
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default').primaryPalette('orange').dark();
});