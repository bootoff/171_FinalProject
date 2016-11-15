var allData = [];
var bostonLocation = [42.360082, -71.058880];

// Variable for the visualization instance
var waterMap;

// Start application by loading the data
loadData();

// specify path to Leaflet images: in [dir]/img
L.Icon.Default.imagePath = 'img/';

function loadData() {
    // load data
    $.getJSON("data/mass_cities.json", function(data) {
        allData = data;

        // draw vis
        createVis();
    });
}


function createVis() {
    // TO-DO: INSTANTIATE VISUALIZATION
    waterMap = new WaterMap("water-map", allData, bostonLocation);
}