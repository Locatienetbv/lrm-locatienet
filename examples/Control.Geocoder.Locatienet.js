(function (factory) {
	// Packaging/modules magic dance
	var L;
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['leaflet'], factory);
	} else if (typeof module !== 'undefined') {
		// Node/CommonJS
		L = require('leaflet');
		module.exports = factory(L);
	} else {
		// Browser globals
		if (typeof window.L === 'undefined')
			throw 'Leaflet must be loaded first';
		factory(window.L);
	}
}(function (L) {
	'use strict';

	L.Control.Geocoder.Locatienet = L.Class.extend({
		options: {
			service_url: 'https://services.locatienet.com/rs/v1/Locate/'
		},

		initialize: function(apikey) {
			this._apikey = apikey;
		},

		geocode: function (query, cb, context) {
			const body = {
				text: query,
				options: {
					language: 'nl',
					numresults: 5
				}
			}


			this._post(this.options.service_url + 'searchByText', body, function(data) {
				var results = [],
				loc,
				latLng,
				latLngBounds;
				if (data && data.length) {
					for (var i = 0; i <= data.length - 1; i++) {
						loc = data[i];
						latLng = L.latLng(loc.coordinate.y, loc.coordinate.x);
						if(loc.hasOwnProperty('bbox'))
							{
								latLngBounds = L.latLngBounds(L.latLng(loc.bbox.slice(0, 2).reverse()), L.latLng(loc.bbox.slice(2, 4).reverse()));
							}
							else
							{
								latLngBounds = L.latLngBounds(latLng, latLng);
							}
							results[i] = {
								name: loc.description,
								bbox: latLngBounds,
								center: latLng
							};
						}
					}

					cb.call(context, results);
			});
		},

		reverse: function (location, scale, cb, context) {

			var body = {
				coordinate: { x: location.lng, y: location.lat },
				options: { numresults: 5}
			}

			this._post(this.options.service_url + 'searchByPosition', body, function(err, data) {
				var results = [],
				loc,
				latLng,
				latLngBounds;
				if (data && data.length) {
					for (var i = 0; i <= data.length - 1; i++) {
						loc = data[i];
						latLng = L.latLng(loc.coordinate.y, loc.coordinate.x);
						if(loc.hasOwnProperty('bbox'))
						{
							latLngBounds = L.latLngBounds(L.latLng(loc.bbox.slice(0, 2).reverse()), L.latLng(loc.bbox.slice(2, 4).reverse()));
						}
						else
						{
							latLngBounds = L.latLngBounds(latLng, latLng);
						}
						results[i] = {
							name: loc.description,
							bbox: latLngBounds,
							center: latLng
						};
					}
				}

				cb.call(context, results);
			});
		},

		_post: function (url, data, callback) {
			fetch(url, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'X-API-KEY': this._apikey
				},
				body: JSON.stringify(data)
			})
				.then(res => res.json())
				.then(res => callback(null, res));
		}
	});

	L.Control.Geocoder.locatienet = function(apikey) {
			return new L.Control.Geocoder.Locatienet(apikey);
	};

}));
