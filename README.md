Leaflet Routing Machine / Locatienet
=====================================

## Maintainers Wanted


[![npm version](https://img.shields.io/npm/v/lrm-locatienet.svg)](https://www.npmjs.com/package/lrm-locatienet)

Extends [Leaflet Routing Machine](https://github.com/perliedman/leaflet-routing-machine) with support for [Locatienet](https://locatienet.com/).

Some brief instructions follow below, but the [Leaflet Routing Machine tutorial on alternative routers](http://www.liedman.net/leaflet-routing-machine/tutorials/alternative-routers/) is recommended.

## Installing

Go to the [releases page](https://github.com/locatienetbv/lrm-locatienet/releases) to get the script to include in your page. Put the script after Leaflet and Leaflet Routing Machine has been loaded.

To use with for example Browserify:

```sh
npm install --save lrm-locatienet
```

## Using

There's a single class exported by this module, `L.Routing.Locatienet`. It implements the [`IRouter`](http://www.liedman.net/leaflet-routing-machine/api/#irouter) interface. Use it to replace Leaflet Routing Machine's default OSRM router implementation:

```javascript
var L = require('leaflet');
require('leaflet-routing-machine');
require('lrm-locatienet'); // This will tack on the class to the L.Routing namespace

L.Routing.control({
    router: new L.Routing.GraphHopper('your Locatienet API key'),
}).addTo(map);
```

Note that you will need to pass a valid Locatienet API key to the constructor.

