/* Based on lab 9: stationMap.js */
/*
 *  FacilityMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _facilityData    -- Array with locations of facilities
 *  @param _cityData        -- geoJSON with MA city boundaries
 *  @param _mapPosition     -- lat, long where the map should be centered
 */

FacilityMap = function(_parentElement, _facilityData, _cityData, _mapPosition) {

    this.parentElement = _parentElement;
    this.facilityData = _facilityData ;
    this.cityData = _cityData;
    this.location = _mapPosition;

    this.initVis();
};

/*
 *  Initialize Massachusetts state map
 */

FacilityMap.prototype.initVis = function() {
    var vis = this;

    // instantiate new state map
    vis.map = L.map(vis.parentElement).setView(vis.location, 8);

    // load and display tile layer on map
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(vis.map);

    // MARKERS --------------------------------------------------

    // create layer group
    facilityMarkers = L.layerGroup().addTo(vis.map);

    // create markers; add them to marker layer group
    vis.facilityData.forEach(function(d) {
        var popupContent = d["Name of Plant"];
        var newMarker = L.marker([d.Latitude, d.Longitude])
            .bindPopup(popupContent);
        facilityMarkers.addLayer(newMarker);
    });

    vis.wrangleData();


};


/*
 *  Data wrangling
 */

FacilityMap.prototype.wrangleData = function() {
    var vis = this;

    // Currently no data wrangling/filtering needed
    // vis.displayData = vis.data;

    // Update the visualization
    vis.updateVis();

};


/*
 *  The drawing function
 */

FacilityMap.prototype.updateVis = function() {

};
