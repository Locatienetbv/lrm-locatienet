var apikey = 'your-locatienet-apikey';

var map = L.map('map');

L.tileLayer(`https://tile{s}.locatienet.com/{z}/{x}/{y}.png?apikey=${apikey}`, {
	attribution: '&copy; <a href="https://locatienet.com">Locatienet</a>',
	subdomains: '0123'
}).addTo(map);

var routingControl = L.Routing.control({
	waypoints: [
		L.latLng(52.74, 4.94),
		L.latLng(52.6792, 4.949)
	],
	geocoder: L.Control.Geocoder.locatienet(apikey),
	router: L.Routing.locatienet(apikey),
	routeWhileDragging: false
}).addTo(map);

var router = routingControl.getRouter();
