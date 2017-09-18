var coffeeLight = coffeeLight || {};
coffeeLight.styles = coffeeLight.styles || {};

coffeeLight.styles.coffee = {
	
	_scene: null,
	fontColor: "white",

	getScene: function() {
		if(coffeeLight.styles.coffee._scene == null) {
			var oLoader = new THREE.ObjectLoader();
			var scene = oLoader.parse(coffeeLight.styles.coffee._data);
			scene.position.z = 16;
			coffeeLight.styles.coffee._scene = scene;
		}
		
		return coffeeLight.styles.coffee._scene;
	},
	
	animate: function(renderer, event) {
		var ripple = coffeeLight.styles.coffee._scene.getObjectByName("Ripple");
		var y = event.offsetY / event.target.offsetHeight;
		var x = event.offsetX / event.target.offsetWidth;
		x = x *  2 - 1;
		y = y * -2 + 1;
		ripple.position.x = x;
		ripple.position.y = y;
		
		var i = 150;
		var render = function () {
			if(i > 0) {
				--i;
				requestAnimationFrame( render );
			}
			var c = i;

			ripple.material.opacity = i/300;
			ripple.scale.x = 2*Math.sqrt(1-i/150)+0.1;
			ripple.scale.y = 2*Math.sqrt(1-i/150)+0.1;
			
			renderer.render( scene, camera );
		};
		requestAnimationFrame( render );
	},
	
	
	_data:  {
	"metadata": {
		"version": 4.5,
		"type": "Object",
		"generator": "Object3D.toJSON"
	},
	"geometries": [
		{
			"uuid": "7F214AB6-5C7F-4AD2-B100-800CF79E259A",
			"type": "CircleBufferGeometry",
			"radius": 1,
			"segments": 128
		},
		{
			"uuid": "AD4479AB-2B4B-4C7C-A8FA-AADC0AEF0586",
			"type": "CircleBufferGeometry",
			"radius": 1,
			"segments": 128
		},
		{
			"uuid": "93376F52-6E78-4810-9418-21DD80C65161",
			"type": "CircleBufferGeometry",
			"radius": 1,
			"segments": 128
		},
		{
			"uuid": "EF78A754-073D-4415-A3B8-C4B48109FDEA",
			"type": "TorusBufferGeometry",
			"radius": 1.95,
			"tube": 1,
			"radialSegments": 32,
			"tubularSegments": 128,
			"arc": 6.283185
		}],
	"materials": [
		{
			"uuid": "8F362E14-2352-481A-B7E8-DB0E149A293E",
			"type": "LineBasicMaterial",
			"color": 16777215,
			"depthFunc": 3,
			"depthTest": true,
			"depthWrite": true,
			"dithering": false
		},
		{
			"uuid": "DA1CA0D5-4CE1-44AD-9961-4BD41A3B0CE9",
			"type": "LineBasicMaterial",
			"color": 7294519,
			"depthFunc": 3,
			"depthTest": true,
			"depthWrite": true,
			"dithering": false
		},
		{
			"uuid": "9122AA6E-6FD5-45BB-9AB4-A1A5373FB975",
			"type": "LineBasicMaterial",
			"color": 0,
			"opacity": 0.0,
			"transparent": true,
			"depthFunc": 3,
			"depthTest": true,
			"depthWrite": true,
			"dithering": false
		},
		{
			"uuid": "8D7806B5-738A-4D96-B0CB-91276A881988",
			"type": "MeshStandardMaterial",
			"color": 16777215,
			"roughness": 0.5,
			"metalness": 0.5,
			"emissive": 0,
			"opacity": 0,
			"transparent": true,
			"depthFunc": 3,
			"depthTest": true,
			"depthWrite": true,
			"skinning": false,
			"morphTargets": false,
			"dithering": false
		}],
	"object": {
		"uuid": "A02E08F7-DFB5-4094-B6C2-A3333B2093F1",
		"type": "Scene",
		"name": "Scene",
		"matrix": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
		"children": [
			{
				"uuid": "95208907-B573-4CD9-B9E9-D19B2D3339A3",
				"type": "AmbientLight",
				"name": "AmbientLight 1",
				"matrix": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
				"color": 2236962,
				"intensity": 1
			},
			{
				"uuid": "DB8A9F1B-83C9-45B7-8798-CFC29E661BA6",
				"type": "SpotLight",
				"name": "SpotLight 2",
				"matrix": [1,0,0,0,0,1,0,0,0,0,1,0,5,10,7.5,1],
				"color": 16777215,
				"intensity": 1,
				"distance": 0,
				"angle": 0.314159,
				"decay": 1,
				"penumbra": 0,
				"shadow": {
					"camera": {
						"uuid": "CBC90D1C-E444-434D-BDEE-7D27360295CD",
						"type": "PerspectiveCamera",
						"fov": 50,
						"zoom": 1,
						"near": 0.5,
						"far": 500,
						"focus": 10,
						"aspect": 1,
						"filmGauge": 35,
						"filmOffset": 0
					}
				}
			},
			{
				"uuid": "310DE723-9D43-43E7-8287-EEBA7E7DD4A8",
				"type": "Mesh",
				"name": "Circle 1",
				"matrix": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
				"geometry": "7F214AB6-5C7F-4AD2-B100-800CF79E259A",
				"material": "8F362E14-2352-481A-B7E8-DB0E149A293E"
			},
			{
				"uuid": "F7ED829A-0DC8-4449-A5A4-F29662C81279",
				"type": "Mesh",
				"name": "Circle 3",
				"matrix": [0.9,0,0,0,0,0.9,0,0,0,0,0.9,0,0,0,0.082192,1],
				"geometry": "AD4479AB-2B4B-4C7C-A8FA-AADC0AEF0586",
				"material": "DA1CA0D5-4CE1-44AD-9961-4BD41A3B0CE9"
			},
			{
				"uuid": "1817F37F-8604-4307-AA3B-1081DCEA907C",
				"type": "Mesh",
				"name": "Ripple",
				"matrix": [0.1,0,0,0,0,0.1,0,0,0,0,0.1,0,0.279785,0.255095,0.173274,1],
				"geometry": "93376F52-6E78-4810-9418-21DD80C65161",
				"material": "9122AA6E-6FD5-45BB-9AB4-A1A5373FB975"
			},
			{
				"uuid": "507FB27C-8257-4242-B315-28552487DB00",
				"type": "Mesh",
				"name": "Torus 5",
				"matrix": [0.9,0,0,0,0,0.9,0,0,0,0,1,0,0,0,-0.045046,1],
				"geometry": "EF78A754-073D-4415-A3B8-C4B48109FDEA",
				"material": "8D7806B5-738A-4D96-B0CB-91276A881988"
			}]
	}
}

};