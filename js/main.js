// GLOBAL VARS ETC. ----------------------------------------------


// global variables for waterMap
var facilityLocations = [],
    citiesMA = [];

// Holden, MA (~center of Massachusetts) -- for center
var centerOfMA = [42.358734, -71.849239];

// global variables for visualization instances
var waterMap;

// specify path to Leaflet images: in [dir]/img
L.Icon.Default.imagePath = 'img/';


// WORK WITH DATA ------------------------------------------------


// load data asynchronously
queue()
    .defer(d3.csv, "data/regions_served.csv")
    .defer(d3.json, "data/mass_cities.json")
    .await(createVis);

// clean up data and create visualizations
function createVis(error, regionsServed, massCities) {
    facilityLocations = regionsServed;
    citiesMA = massCities;

    // waterMap.js clean up data
    facilityLocations.forEach(function(d) {
        d.Latitude = +d.Latitude;
        d.Longitude = +d.Longitude;
        d["Towns served"] = d["Towns served"].split(',');
    });

    // instantiate visualizations
    waterMap = new WaterMap("water-map", facilities, citiesMA, centerOfMA);
}