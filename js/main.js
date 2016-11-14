var allData = [];
var bostonLocation = [42.360082, -71.058880];

// Variable for the visualization instance
var stationMap;

// Start application by loading the data
loadData();

function loadData() {

    // draw vis
    createVis();
}


function createVis() {
    // TO-DO: INSTANTIATE VISUALIZATION
    waterMap = new WaterMap("water-map", allData, bostonLocation);
}