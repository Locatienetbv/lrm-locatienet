(function() {
	'use strict';

	var L = require('leaflet');

	L.Routing = L.Routing || {};

	L.Routing.Locatienet = L.Evented.extend({
		options: {
			serviceUrl: 'https://services.locatienet.com/rs/v1/Route/calculateRouteDescription',
			timeout: 30 * 1000,
			urlParameters: {}
		},

		initialize: function(apikey, options) {
			this._apikey = apikey;
			L.Util.setOptions(this, options);
		},

		route: function(waypoints, callback, context, options) {
			var timedOut = false,
				wps = [],
				body,
				timer,
				wp,
				i;

			options = options || {};
			body = this.buildRouteRequest(waypoints, options);

			timer = setTimeout(function() {
								timedOut = true;
								callback.call(context || callback, {
									status: -1,
									message: 'Locatienet request timed out.'
								});
							}, this.options.timeout);

			// Create a copy of the waypoints, since they
			// might otherwise be asynchronously modified while
			// the request is being processed.
			for (i = 0; i < waypoints.length; i++) {
				wp = waypoints[i];
				wps.push({
					latLng: wp.latLng,
					name: wp.name,
					options: wp.options
				});
			}

			this._post(this.options.serviceUrl, body, L.bind(function(err, data) {
				

				clearTimeout(timer);
				if (!timedOut) {
					var fired = err ? err : data;
					this.fire("response", {
						//status: fired.status,
						//limit: Number(fired.getResponseHeader("X-RateLimit-Limit")),
						//remaining: Number(fired.getResponseHeader("X-RateLimit-Remaining")),
						//reset: Number(fired.getResponseHeader("X-RateLimit-Reset")),
						//credits: Number(fired.getResponseHeader("X-RateLimit-Credits"))
					});
					if (!err) {
						this._routeDone(data, wps, callback, context);
					} else {
						var finalResponse;
						var responseText = err && err.responseText;
						try {
							finalResponse = JSON.parse(responseText);
						} catch (e) {
							finalResponse = responseText;
						}

						callback.call(context || callback, {
							status: -1,
							message: 'HTTP request failed: ' + err,
							response: finalResponse
						});
					}
				}
			}, this));

			return this;
		},

		_routeDone: function(response, inputWaypoints, callback, context) {
			var alts = [],
			    mappedWaypoints,
			    coordinates,
			    i,
			    path;

			context = context || callback;
			path = response;
			coordinates = this._decodePolyline(path.polyline);
			mappedWaypoints =
				this._mapWaypointIndices(inputWaypoints, path.descriptions, coordinates);

			alts.push({
				name: '',
				coordinates: coordinates,
				instructions: this._convertInstructions(path.descriptions, coordinates),
				summary: {
					totalDistance: path.distance,
					totalTime: path.travelTime,
					totalAscend: 0,
				},
				inputWaypoints: inputWaypoints,
				actualWaypoints: mappedWaypoints.waypoints,
				waypointIndices: mappedWaypoints.waypointIndices
			});
			

			callback.call(context, null, alts);
		},

		_decodePolyline: function(coords) {
			var latlngs = new Array(coords.length),
				i;
			for (i = 0; i < coords.length; i++) {
				latlngs[i] = new L.LatLng(coords[i].y, coords[i].x);
			}

			return latlngs;
		},

		_toWaypoints: function(inputWaypoints, vias) {
			var wps = [],
			    i;
			for (i = 0; i < vias.length; i++) {
				wps.push({
					latLng: L.latLng(vias[i]),
					name: inputWaypoints[i].name,
					options: inputWaypoints[i].options
				});
			}

			return wps;
		},

		buildRouteRequest: function(waypoints, options) {
			var request = {
				locations: [],
				options: {
					"vehicle": "carfast",
					"optimization": "optimal",
					"language": "nl",
					'includePolyline': true
				}
			}

			for (var i = 0; i < waypoints.length; i++) {
				request.locations.push({ coordinate: { x: waypoints[i].latLng.lng, y: waypoints[i].latLng.lat } });
			}

			return request;

		},

		_convertInstructions: function(instructions, coordinates) {
			var signToType = {
				'TURNHALFLEFT': 'SlightLeft',
				'TURNSHARPLEFT': 'SharpLeft',
				'TURNLEFT': 'Left',
				'CONTINUE': 'Straight',
				'TURNHALFRIGHT': 'SlightRight',
				'TURNRIGHT': 'Right',
				'TURNSHARPRIGHT': 'SharpRight',
				'ARRIVELEFT': 'DestinationReached',
				'ARRIVERIGHT': 'DestinationReached',
				'TAKEROUNDABOUTRIGHT': 'Roundabout',
				'TAKEROUNDABOUTLEFT': 'Roundabout'
				},
				result = [],
				type,
				i,
				instr;

			for (i = 0; instructions && i < instructions.length; i++) {
				instr = instructions[i];
				if (!instr.description) continue;
				if (result.length === 0) {
					type = 'Head';
				} else {
					if (i < instructions.length - 2 && ['ARRIVELEFT', 'ARRIVERIGHT'].includes(instr.maneuverType)) {
						type = 'WaypointReached';
					} else {
						type = signToType[instr.maneuverType];
					}
				}
				result.push({
					type: type,
					modifier: type,
					text: instr.description,
					distance: instr.accDistance,
					time: instr.accTime,
					index: coordinates.findIndex(c => c.lat == instr.coordinate.y && c.lng == instr.coordinate.x),
					exit: 0,
				});
			}

			return result;
		},

		_mapWaypointIndices: function(waypoints, instructions, coordinates) {
			var wps = [],
				wpIndices = [],
			    i,
			    idx;

			for (i = 0; instructions && i < instructions.length; i++) {
				if (instructions[i].event === 'WAYPOINT') {
					idx = coordinates.findIndex(c => c.lat == instructions[i].coordinate.y && c.lng == instructions[i].coordinate.x);
					wpIndices.push(idx);
					wps.push({
						latLng: coordinates[idx],
						name: waypoints[wps.length].name
					});
				}
			}


			return {
				waypointIndices: wpIndices,
				waypoints: wps
			};
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

	L.Routing.locatienet = function(apikey, options) {
		return new L.Routing.Locatienet(apikey, options);
	};

	module.exports = L.Routing.Locatienet;
})();
