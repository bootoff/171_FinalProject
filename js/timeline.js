/*
 *  Author: Alma Lafler
 *
 *  This visualization shows:
 *  Trend of electricity savings, 2007-2016 (some facilities will have data starting in 2008, some in 2012)
 *  Usage Cost for 21 facilities, 2007-2016
 *
 *  TimeLine - Object constructor function
 *
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Flat array of data from all facilities
 *  @param _dataRolledUp    -- Array of unique facility objects with data for each
 */

TimeLine = function(_parentElement, _data, _dataRolledUp) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.dataRoll = _dataRolledUp;

    this.initVis();
};


/*
 *  Initialize scatter plot
 */

TimeLine.prototype.initVis = function() {
    var vis = this;

    // define svg size and margins
    vis.margin = {top: 30, right: 30, bottom: 60, left: 100},
        vis.width = 700 - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom,
        vis.offset = 50;

    // add svg
    vis.svg = d3.select("#" + vis.parentElement)
        .append("svg")
        .attr("width", (vis.width + vis.margin.left + vis.margin.right))
        .attr("height", (vis.height + vis.margin.top + vis.margin.bottom))
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top +")");

    // axis groups || (initial) axis labels
    vis.xAxisGroup = vis.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0, " + vis.height + ")");
    vis.yAxisGroup = vis.svg.append("g")
        .attr("class", "axis y-axis");
    vis.xAxisGroup.append("text")
        .attr("class", "axis-label")
        .attr("id", "x-label")
        .attr("x", (vis.width / 2))
        .attr("y", vis.offset)
        .text("Year");
    vis.yAxisGroup.append("text")
        .attr("class", "axis-label")
        .attr("id", "y-label")
        .attr("x", -(vis.height / 2))
        .attr("y", -(1.5 * vis.offset))
        .attr("transform", "rotate(-90)")
        .text("Electricity Savings (USD)");

    // wrangle data
    vis.wrangleData();
};


/*
 *  Data wrangling
 */

TimeLine.prototype.wrangleData = function() {
    var vis = this;

    // grab fresh instance of dataset
    vis.displayData = vis.data;

    var yearExtent = d3.extent(vis.displayData, function(d) {
        return d.FY;
    });
    var selectionExtent = d3.extent(vis.displayData, function(d) {
        return d.savingsUSD;
    });
    // scale functions
    vis.x = d3.scale.linear()
        .domain(yearExtent)
        .range([0, vis.width]);
    vis.y = d3.scale.linear()
        .domain(selectionExtent)
        .range([vis.height, 0]);

    // axis functions
    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .tickFormat(function(d) {
            return vis.formatYear(d);
        })
        .orient("bottom");
    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    // Update the visualization
    vis.updateVis();
};


/*
 *  Update function
 */

TimeLine.prototype.updateVis = function() {
    var vis = this;

    // draw line graph || draw data points
    vis.svg.selectAll(".line")
        .remove();
    vis.dataRoll.forEach(function(d) {
        vis.updateLine(d);
        vis.updatePoints(d);
    });

    // update axes
    vis.svg.select(".x-axis")
        .call(vis.xAxis);
    vis.svg.select(".y-axis")
        .transition()
        .duration(800)
        .call(vis.yAxis);
};


/*
 *  The line-drawing function
 */
TimeLine.prototype.updateLine = function(indexData) {
    var vis = this;

    // data join
    var dataSelection = vis.svg.selectAll(".line" + vis.spaceFormat(indexData.id))
        .data(indexData.values);

    // enter
    dataSelection.enter()
        .append("path")
        .attr("class", "line line-" + vis.spaceFormat(indexData.id));

    // line function || function call
    var drawLine = d3.svg.line()
        .x(function(d) {
            return vis.x(d.FY);
        })
        .y(function(d) {
            return vis.y(d.savingsUSD);
        })
        .interpolate("linear");

    dataSelection
        .transition()
        .delay(700)
        .duration(800)
        .attr("d", drawLine(indexData.values));

    // exit
    dataSelection.exit()
        .remove();
};

/*
 *  The point-drawing function
 */
TimeLine.prototype.updatePoints = function(indexData) {
    var vis = this;

    // data join
    var dataSelection = vis.svg.selectAll(".tooltip-circle-" + vis.spaceFormat(indexData.id))
        .data(indexData.values);

    // enter
    dataSelection.enter()
        .append("circle")
        .attr("class", "tooltip-circle-" + vis.spaceFormat(indexData.id))
        .attr("r", 5);

    // update tooltip circles
    dataSelection
        .transition()
        .duration(800)
        .attr("cx", function(d) {
            return vis.x(d.FY);
        })
        .attr("cy", function(d) {
            return vis.y(d.savingsUSD);
        });

    // exit
    dataSelection.exit()
        .remove();
};


/*
 *  format year text correctly
 */
TimeLine.prototype.formatYear = function(str) {
    if (str.toString().length >1)
        str = "20" + str;
    else
        str = "200" + str;
    return str;
};


// remove non-selector characters from strings
TimeLine.prototype.spaceFormat = function(str) {
    str = str.replace(/\s+/g, '_');
    str = str.replace("(", '-');
    str = str.replace(")", '');
    return str;
};


/*
 *  Listen to selection box
 */
d3.select("#timeline-select").on("change", function() {
    // get selection and update visualization
    vis.currSelection = d3.select("#timeline-select").property("value");
    TimeLine.updateVis();
});