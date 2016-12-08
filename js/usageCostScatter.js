/*
 *  Author: Alma Lafler
 *
 *  UsageCostScatter - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Flat array of data from all facilities
 *  @param _dataRolledUp    -- Array of unique facility objects with data for each
 */

UsageCostScatter = function(_parentElement, _data, _dataRolledUp) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.dataRoll = _dataRolledUp;

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
    vis.svg = d3.select("#" + vis.parentElement)
        .append("svg")
        .attr("width", (vis.width + vis.margin.left + vis.margin.right))
        .attr("height", (vis.height + vis.margin.top + vis.margin.bottom))
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top +")");

    // initialize tooltips
    vis.tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10,0])
        .html(function(d) {
            return d.Facility + "<br/>" + vis.formatYear(d.FY) + "<br/>" + d.UsageKWh  + " KWh<br/>$" + d.UsageUSD;
        });
    vis.svg.call(vis.tip);

    // draw axis labels
    vis.svg.append("text")
        .attr("class", "label axis-label x-label")
        .attr("x", (vis.width / 2))
        .attr("y", vis.height + vis.offset)
        .text("Usage (KWh)");
    vis.svg.append("text")
        .attr("class", "label axis-label y-label")
        .attr("x", -(vis.height / 2))
        .attr("y", -(vis.offset * 1.5))
        .attr("transform", "rotate(-90)")
        .text("Usage Cost (USD)");

    // wrangle data
    vis.wrangleData();
};


/*
 *  Data wrangling
 */

UsageCostScatter.prototype.wrangleData = function() {
    var vis = this;

    vis.displayData = vis.data.filter(function(d) {
        if ((d.UsageKWh != 0) && (d.UsageUSD != 0))
            return d;
    });

    // scale functions
    var usageKWhMax = d3.max(vis.displayData, function(d) {
        return d.UsageKWh;
    });
    var usageCostMax = d3.max(vis.displayData, function(d) {
        return d.UsageUSD;
    });
    vis.x = d3.scale.linear()
        .domain([0, usageKWhMax])
        .range([0, vis.width]);
    vis.y = d3.scale.linear()
        .domain([0, (usageCostMax + 100000)])
        .range([vis.height, 0]);
    vis.colors = ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#006d2c','#00441b', '#000000'];

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
 *  The vis update function
 */

UsageCostScatter.prototype.updateVis = function() {
    var vis = this;

    // draw line graph || draw data points
    vis.svg.selectAll(".line")
        .remove();
    vis.dataRoll.forEach(function(d) {
        vis.updateLine(d);
        vis.updatePoints(d);
    });

    // draw axes
    vis.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0, " + vis.height + ")")
        .call(vis.xAxis);
    vis.svg.append("g")
        .attr("class", "axis y-axis")
        .call(vis.yAxis);

    vis.legend = vis.svg.append("g")
        .attr("class","legend")
        .attr("transform","translate(50,30)")
        .style("font-size","12px")
        .call(d3.legend);
};


/*
 *  The line-drawing function
 */

UsageCostScatter.prototype.updateLine = function(indexData) {
    var vis = this;

    // line-drawing function
    var drawLine = d3.svg.line()
        .x(function(d) {
            return vis.x(d.UsageKWh);
        })
        .y(function(d) {
            return vis.y(d.UsageUSD);
        })
        .interpolate("linear");

    // select
    var facility = vis.svg.selectAll(".line" + vis.spaceFormat(indexData.id))
        .data(indexData.values);

    // enter & update
    // on hover: make points for this line appear
    facility.enter()
        .append("path")
        .attr("class", "line vis-line line-" + vis.spaceFormat(indexData.id))
        .on("mouseover", function() {
            vis.svg.selectAll(".point-" + vis.spaceFormat(indexData.id))
                .style("display", null);
        })
        .on("mouseout", function() {
            vis.svg.selectAll(".point-" + vis.spaceFormat(indexData.id))
                .style("display", "none");
        })
        .transition()
        .delay(700)
        .duration(800)
        .attr("d", drawLine(indexData.values));

    // exit
    facility.exit()
        .remove();
};

/*
 *  The point-drawing function
 */

UsageCostScatter.prototype.updatePoints = function(indexData) {
    var vis = this;

    // draw data points (hidden)
    // on hover: make tooltip appear & make all points for this line appear
    vis.svg.selectAll(".point" + vis.spaceFormat(indexData.id))
        .data(indexData.values)
        .enter()
        .append("circle")
        .attr("class", "point vis-point point-" + vis.spaceFormat(indexData.id))
        .attr("cx", function(d) {
            return vis.x(d.UsageKWh);
        })
        .attr("cy", function(d) {
            return vis.y(d.UsageUSD);
        })
        .attr("r", 5)
        .style("fill", function(d) {
            return vis.colors[d.FY - 7];
        })
        .style("display", "none")
        .attr("data-legend",function(d) {
            return "20" + d.FY;
        })
        .on("mouseover", function(d) {
            vis.tip.show(d);
            //$("#timeline-svg").selectAll("line-" + vis.spaceFormat(indexData.id))
            //    .style("fill", "blue");
            vis.svg.selectAll(".point-" + vis.spaceFormat(indexData.id))
                .style("display", null);
        })
        .on("mouseout", function(d) {
            vis.tip.hide(d);
            vis.svg.selectAll(".point-" + vis.spaceFormat(indexData.id))
                .style("display", "none");
        });
};


// remove non-selector characters from strings
UsageCostScatter.prototype.spaceFormat = function(str) {
    str = str.replace(/\s+/g, '_');
    str = str.replace("(", '-');
    str = str.replace(")", '');
    return str;
};


/*
 *  format year text correctly
 */
UsageCostScatter.prototype.formatYear = function(str) {
    if (str.toString().length >1)
        str = "20" + str;
    else
        str = "200" + str;
    return str;
};