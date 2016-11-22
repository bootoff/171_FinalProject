/* Based on lab 9: stationMap.js */
/*
 *  UsageCostScatter - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

UsageCostScatter = function(_parentElement, _usageCostData) {

    this.parentElement = _parentElement;
    this.usageCostData = _usageCostData;

    this.initVis();
};

// define svg size and margins
var margin = {top: 10, right: 10, bottom: 40, left: 40};
var width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    offset = 30;

/*
 *  Initialize scatter plot
 */

FacilityMap.prototype.initVis = function() {
    var vis = this;

    // add svg
    var svg = d3.select("#chart-area")
        .append("svg")
        .attr("width", (width + margin.left + margin.right))
        .attr("height", (height + margin.top + margin.bottom))
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top +")");

    // scale functions
    var xScale = d3.scale.log()
        .domain([incomeMin, incomeMax])
        .range([0, width]);
    var yScale = d3.scale.linear()
        .domain([lifeExpectancyMin, lifeExpectancyMax])
        .range([height, 0]);
    var rScale = d3.scale.linear()
        .domain([populationMin, populationMax])
        .range([4, 30]);
    var colorScale = d3.scale.category10()
        .domain([categories]);

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
