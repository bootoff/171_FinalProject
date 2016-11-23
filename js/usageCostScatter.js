/* Based on lab 9: stationMap.js */
/*
 *  UsageCostScatter - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

UsageCostScatter = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};

/*
 *  Initialize scatter plot
 */

UsageCostScatter.prototype.initVis = function() {
    var vis = this;

    // define svg size and margins
    vis.margin = {top: 30, right: 10, bottom: 60, left: 100},
        vis.width = 700 - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom,
        vis.offset = 50;


    // add svg
    vis.svg = d3.select("#usagecost-scatter")
        .append("svg")
        .attr("width", (vis.width + vis.margin.left + vis.margin.right))
        .attr("height", (vis.height + vis.margin.top + vis.margin.bottom))
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top +")");

    // wrangle data
    vis.wrangleData();

    // draw axis labels
    vis.svg.append("text")
        .attr("class", "label x-label")
        .attr("x", (vis.width / 2))
        .attr("y", vis.height + vis.offset)
        .text("Usage Cost (USD)");
    vis.svg.append("text")
        .attr("class", "label y-label")
        .attr("x", -(vis.height / 2))
        .attr("y", -(vis.offset * 1.5))
        .attr("transform", "rotate(-90)")
        .text("Usage (KWh)");
};


/*
 *  Data wrangling
 */

UsageCostScatter.prototype.wrangleData = function() {
    var vis = this;

    vis.displayData = vis.data;

    // get unique names of facilities
    var uniqueFacilities = d3.map(vis.data, function(d) {
        return d.Facility;
    }).keys();

    // put unique facilities into array of objects
    vis.facilities = uniqueFacilities.map(function(d) {
        return {
            "id": d,
            "values": []
        };
    });

    // populate each facility object

    console.log(vis.facilities);

    // scale functions
    var usageKWhMax = d3.max(vis.displayData, function(d) {
        return d.UsageKWh;
    });
    var usageCostMax = d3.max(vis.displayData, function(d) {
        return d.UsageUSD;
    });
    var yearExtent = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];
    vis.x = d3.scale.linear()
        .domain([0, usageKWhMax])
        .range([0, vis.width]);
    vis.y = d3.scale.linear()
        .domain([0, (usageCostMax + 100000)])
        .range([vis.height, 0]);
    vis.colorScale = d3.scale.category10()
        .domain(yearExtent);

    // axis functions
    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");
    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    // Update the visualization
    vis.updateVis();
};


/*
 *  The drawing function
 */

UsageCostScatter.prototype.updateVis = function() {
    var vis = this;

    // line-drawing function
    vis.drawLine = d3.svg.line()
        .x(function(d) {
            return vis.x(d.UsageKWh);
        })
        .y(function(d) {
            return vis.y(d.UsageUSD);
        })
        .interpolate("linear");

    // draw (hidden) lines
    vis.svg.selectAll(".line")
        .data(vis.displayData)
        .enter()
        .append("path")
        .attr("class", "line")
        .transition()
        .attr("d", vis.drawLine(vis.displayData));

    // draw data points
    vis.svg.selectAll(".point")
        .data(vis.displayData)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", function(d) {
            return vis.x(d.UsageKWh);
        })
        .attr("cy", function(d) {
            return vis.y(d.UsageUSD);
        })
        .attr("r", 5)
        .style("fill", function(d) {
            return vis.colorScale(d.FY);
        });

    // draw axes
    vis.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0, " + vis.height + ")")
        .call(vis.xAxis);
    vis.svg.append("g")
        .attr("class", "axis y-axis")
        .call(vis.yAxis);
};
