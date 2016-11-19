// GLOBAL VARS ETC. ----------------------------------------------

// global variables for waterMap
var facilityLocations = [],
    citiesMA = [],
    plants = [];

// Holden, MA (~center of Massachusetts) -- for center
var centerOfMA = [42.358734, -71.849239];

// global variables for visualization instances
var facilityMap;

// specify path to Leaflet images: in [dir]/img
L.Icon.Default.imagePath = 'img/';


// WORK WITH DATA ------------------------------------------------

// load data asynchronously
queue()
    .defer(d3.csv, "data/regions_served.csv")
    .defer(d3.json, "data/mass_cities.json")
    .defer(d3.csv, "data/plants.csv")
    .await(createVis);


// clean up data and create visualizations
function createVis(error, regionsServed, massCities, data3) {

    facilityLocations = regionsServed;
    citiesMA = massCities;
    plants = data3

    console.log(plants);

    // waterMap.js clean up data
    facilityLocations.forEach(function(d) {
        d.Latitude = +d.Latitude;
        d.Longitude = +d.Longitude;
        d["Towns served"] = d["Towns served"].split(',');
    });

    // instantiate visualizations
    facilityMap = new FacilityMap("water-map", facilityLocations, citiesMA, centerOfMA);
}