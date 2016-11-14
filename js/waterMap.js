/* Based on lab 9: stationMap.js */


/*
 *  StationMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

WaterMap = function(_parentElement, _data, _mapPosition) {

    this.parentElement = _parentElement;
    this.data = _data;
    this.location = _mapPosition;

    this.initVis();
};

/*
 *  Initialize Massachusetts state map
 */

WaterMap.prototype.initVis = function() {
    var vis = this;

    // MASS STATE MAP -------------------------------------------

    // instantiate new city map
    vis.map = L.map(vis.parentElement).setView(vis.location, 13);

    // load and display tile layer on map
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(vis.map);

    vis.wrangleData();
};


/*
 *  Data wrangling
 */

WaterMap.prototype.wrangleData = function() {
    var vis = this;

    // Currently no data wrangling/filtering needed
    // vis.displayData = vis.data;

    // Update the visualization
    vis.updateVis();

};


/*
 *  The drawing function
 */

WaterMap.prototype.updateVis = function() {

};
