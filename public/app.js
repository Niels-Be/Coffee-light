// Initialize Firebase
var config = {
    apiKey: "AIzaSyD9lqJmbdm9l_QmhB4f1j_Kdu3fMYerGkA",
    authDomain: "coffee-light.firebaseapp.com",
    databaseURL: "https://coffee-light.firebaseio.com",
    projectId: "coffee-light",
    storageBucket: "coffee-light.appspot.com",
    messagingSenderId: "252605375808"
};
firebase.initializeApp(config);

// [START get_messaging_object]
// Retrieve Firebase Messaging object.
const messaging = firebase.messaging();
// [END get_messaging_object]
// IDs of divs that display Instance ID token UI or request permission UI.
const tokenDivId = 'token_div';
const permissionDivId = 'permission_div';
// [START refresh_token]
// Callback fired if Instance ID token is updated.
messaging.onTokenRefresh(function() {
    messaging.getToken()
        .then(function(refreshedToken) {
            console.log('Token refreshed.');
            // Send Instance ID token to app server.
            sendTokenToServer(refreshedToken);
            // [START_EXCLUDE]
            // Display new Instance ID token and clear UI of all previous messages.
            init();
            // [END_EXCLUDE]
        })
        .catch(function(err) {
            console.log('Unable to retrieve refreshed token ', err);
        });
});
// [END refresh_token]
// [START receive_message]
// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a sevice worker
//   `messaging.setBackgroundMessageHandler` handler.
messaging.onMessage(function(payload) {
    console.log("Message received. ", payload);
	
	if(payload.data.name !== coffeeLight.loadName()){
		var notification = new Notification(payload.notification.title, payload.notification);
	}
});
// [END receive_message]
function init() {
    // [START get_token]
    // Get Instance ID token. Initially this makes a network call, once retrieved
    // subsequent calls to getToken will return from cache.
    messaging.getToken()
        .then(function(currentToken) {
            if (currentToken) {
                sendTokenToServer(currentToken);
            } else {
                // Show permission request.
                console.log('No Instance ID token available. Request permission to generate one.');
                // Show permission UI.
                requestPermission();
            }
        })
        .catch(function(err) {
            console.log('An error occurred while retrieving token. ', err);
        });
}
// Send the Instance ID token your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function sendTokenToServer(currentToken) {
	console.log('Sending token to server...');
	// TODO(developer): Send the current token to your server.
	fetch("/register", {
		method: 'POST',
		headers: new Headers({
			"content-type": "application/json"
		}),
		body: JSON.stringify({
			token: currentToken
		})
	});
}

function showHideDiv(divId, show) {
    const div = document.querySelector('#' + divId);
    if (show) {
        div.style = "display: visible";
    } else {
        div.style = "display: none";
    }
}

function requestPermission() {
    console.log('Requesting permission...');
    // [START request_permission]
    messaging.requestPermission()
        .then(function() {
            console.log('Notification permission granted.');
            // TODO(developer): Retrieve an Instance ID token for use with FCM.
            // [START_EXCLUDE]
            // In many cases once an app has been granted notification permission, it
            // should update its UI reflecting this.
            init();
            // [END_EXCLUDE]
        })
        .catch(function(err) {
            console.log('Unable to get permission to notify.', err);
        });
    // [END request_permission]
}

function deleteToken() {
    // Delete Instance ID token.
    // [START delete_token]
    messaging.getToken()
        .then(function(currentToken) {
            messaging.deleteToken(currentToken)
                .then(function() {
                    console.log('Token deleted.');
                })
                .catch(function(err) {
                    console.log('Unable to delete token. ', err);
                });
            // [END delete_token]
        })
        .catch(function(err) {
            console.log('Error retrieving Instance ID token. ', err);
        });
}
init();