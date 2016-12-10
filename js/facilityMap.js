/*
 *  Author: Alma Lafler
 *
 *  Based on lab 9: stationMap.js
 *  Shows general info about facilities on a map.
 *
 *  FacilityMap - Object constructor function
 *
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

    // STATE MAP ------------------------------------------------

    // instantiate new state map
    vis.map = L.map(vis.parentElement).setView(vis.location, 8);

    // load and display tile layer on map
    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 10,
        minZoom: 7
    }).addTo(vis.map);

    // CITY MAPS ------------------------------------------------

    // style for cities
    var cityStyle = {
        fill: "blue",
        weight: 1
    };

    // idea: add one layer to the map, with all towns served, for each facility
    // add city boundaries to map (hidden)
    vis.cities = L.geoJson(vis.cityData, {
        style: cityStyle,
        className: "city-bound"
    }).addTo(vis.map);

    // hide all cities
    d3.selectAll(".city-bound")
        .style("opacity",0);

    // set IDs for cities
    vis.cities.eachLayer(function (layer) {
        layer._path.id = 'feature-' + vis.removeSpaces(vis.reformat(layer.feature.properties.name));
    });

    // MARKERS --------------------------------------------------

    // create layer group
    facilityMarkers = L.layerGroup().addTo(vis.map);

    // create markers; add them to marker layer group
    vis.facilityData.forEach(function(d) {
        var popupContent = d.name + "<br/>Location: " + d.city + ", MA";
        var newMarker = L.marker([d.latitude, d.longitude])
            .bindPopup(popupContent)
            .on("mouseover", function() {
                // open popup on hover
                this.openPopup();
                // highlight the towns served by this facility
                d.townsServed.forEach(function(d2) {
                    d3.select("#feature-" + vis.removeSpaces(vis.reformat(d2)))
                        .style("opacity", 0.8);
                });
            })
            .on("mouseout", function() {
                // close popup
                this.closePopup();
                // hide the towns served by this facility
                d.townsServed.forEach(function(d2) {
                    d3.select("#feature-" + vis.removeSpaces(vis.reformat(d2)))
                        .style("opacity", 0);
                });
            });
        facilityMarkers.addLayer(newMarker);
    });

    // adjust geoJSON city names
    vis.wrangleData();
};


/*
 *  Data wrangling
 */

FacilityMap.prototype.wrangleData = function() {
    var vis = this;

    vis.displayData = vis.cityData;

    vis.displayData.features.forEach(function(d) {
        d.properties.name = vis.reformat(d.properties.name);
    });

    // Update the visualization
    //vis.updateVis();
};


/*
 *  The drawing function
 */

FacilityMap.prototype.updateVis = function() {
};


// remove unwanted strings from geoJSON city names
FacilityMap.prototype.reformat = function(str) {
    str = str.replace(", MA", '');
    return str;
};

// replace spaces by -'s
FacilityMap.prototype.removeSpaces = function(str) {
    str = str.replace(" ", "-");
    return str;
};