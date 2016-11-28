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

    // STATE MAP ------------------------------------------------

    // instantiate new state map
    vis.map = L.map(vis.parentElement).setView(vis.location, 8);

    // load and display tile layer on map
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(vis.map);

    // CITY MAPS ------------------------------------------------

    // add visibility attribute for cities
    vis.cityData.features.forEach(function(d) {
        d.properties.show_city = true;
    });

    // style for cities
    var cityStyle = {
        fill: "blue",
        weight: 1,
        opacity: 0.5
    };


    // idea: add one layer to the map, with all towns served, for each facility
    // add city boundaries to map (hidden)
    vis.cities = L.geoJson(vis.cityData, {
        filter: function(feature) {
            return feature.properties.show_city;
        },
        id: function(feature) {
            return feature.properties.name;
        },
        style: cityStyle
    })
        .addTo(vis.map);

    // MARKERS --------------------------------------------------

    // create layer group
    facilityMarkers = L.layerGroup().addTo(vis.map);

    // create markers; add them to marker layer group
    vis.facilityData.forEach(function(d) {
        var popupContent = d.nameOfFacility;
        var newMarker = L.marker([d.latitude, d.longitude])
            .bindPopup(popupContent)
            .on("mouseover", function() {
                d.townsServed.forEach(function(d) {
                    vis.cityData.features.forEach(function(d2) {
                        if (d == d2.properties.name) {
                            d.properties.show_city = false;
                        }
                    });
                });
            })
            .on("mouseout", function() {
                console.log("1");
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

    vis.cityData.features.forEach(function(d) {
        d.properties.name = vis.reformat(d.properties.name);
    });

    console.log(vis.cityData);

    // vis.displayData = vis.data;

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
