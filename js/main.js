// GLOBAL VARS ETC. ----------------------------------------------


// global variables for data
var facilities = [],
    citiesMA = [],
    plants = [];

// Holden, MA (~center of Massachusetts)
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
    .defer(d3.json, "data/plants.json")
    .await(createVis);



// clean up data and create visualizations
function createVis(error, data1, data2, data3) {

    console.log(data1, data2, data3);
    facilities = data1;
    citiesMA = data2;
    plants = data3;

    // clean up data
    facilities.forEach(function(d) {
        d.Latitude = +d.Latitude;
        d.Longitude = +d.Longitude;
        d["Towns served"] = d["Towns served"].split(',');
    });

    console.log(facilities);

    // instantiate visualizations
    waterMap = new WaterMap("water-map", facilities, citiesMA, centerOfMA);
}
