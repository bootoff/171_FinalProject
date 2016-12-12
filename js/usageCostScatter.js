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
    vis.margin = {top: 30, right: 40, bottom: 80, left: 100},
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
            var usageKWh = d.UsageKWh.toLocaleString('en-US'),
                usageUSD = d.UsageUSD.toLocaleString('en-US');
            return d.Facility + "<br/>" + vis.formatYear(d.FY) + "<br/>" + usageKWh  + " KWh<br/>$" + usageUSD;
        });
    vis.svg.call(vis.tip);

    // draw axis labels
    vis.svg.append("text")
        .attr("class", "label axis-label x-label")
        .attr("x", (vis.width / 2))
        .attr("y", vis.height + (vis.offset * 1.5))
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
    vis.xPower = d3.scale.pow()
        .exponent([1/3])
        .domain([0, usageKWhMax])
        .range([0, vis.width]);
    vis.yPower = d3.scale.pow()
        .exponent([1/3])
        .domain([0, (usageCostMax + 100000)])
        .range([vis.height, 0]);
    vis.colors = ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#006d2c','#00441b', '#000000'];

    // axis functions
    vis.xAxis = d3.svg.axis()
        .scale(vis.xPower)
        .orient("bottom");
    vis.yAxis = d3.svg.axis()
        .scale(vis.yPower)
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
        .call(vis.xAxis)
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("dx", ".8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(45)"
        });
    vis.svg.append("g")
        .attr("class", "axis y-axis")
        .call(vis.yAxis);

    // draw legend
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

    // select
    var facility = vis.svg.selectAll(".line" + vis.spaceFormat(indexData.id))
        .data(indexData.values);

    // line-drawing function
    var drawLine = d3.svg.line()
        .x(function(d) {
            return vis.xPower(d.UsageKWh);
        })
        .y(function(d) {
            return vis.yPower(d.UsageUSD);
        })
        .interpolate("linear");

    // enter & update
    // on hover: make points for this line appear
    facility.enter()
        .append("path")
        .attr("class", "line vis-line ucs-line line-" + vis.spaceFormat(indexData.id))
        .on("mouseover", function() {
            // highlight points
            vis.svg.selectAll(".point-" + vis.spaceFormat(indexData.id))
                .style("opacity", 100);
            // highlight lines
            vis.svg.selectAll(".line-" + vis.spaceFormat(indexData.id))
                .style("stroke", "#5775C5")
                .style("stroke-width", 4);
        })
        .on("mouseout", function() {
            // unhighlight points
            vis.svg.selectAll(".point-" + vis.spaceFormat(indexData.id))
                .style("opacity", 0);
            // unhighlight lines
            vis.svg.selectAll(".line-" + vis.spaceFormat(indexData.id))
                .style("stroke", "#4B4B4B")
                .style("stroke-width", 2);
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
    var dataSelection = vis.svg.selectAll(".point" + vis.spaceFormat(indexData.id))
        .data(indexData.values);

    dataSelection.enter()
        .append("circle")
        .attr("class", "point vis-point point-" + vis.spaceFormat(indexData.id))
        .attr("cx", function(d) {
            return vis.xPower(d.UsageKWh);
        })
        .attr("cy", function(d) {
            return vis.yPower(d.UsageUSD);
        })
        .attr("r", 5)
        .style("fill", function(d) {
            return vis.colors[d.FY - 7];
        })
        .style("opacity", 0)
        .on("mouseover", function(d) {
            // tooltip show
            vis.tip.show(d);
            //$("#timeline-svg").selectAll("line-" + vis.spaceFormat(indexData.id))
            //    .style("fill", "blue");
            // highlight points
            vis.svg.selectAll(".point-" + vis.spaceFormat(indexData.id))
                .style("opacity", 100);
            // highlight lines
            vis.svg.selectAll(".line-" + vis.spaceFormat(indexData.id))
                .style("stroke", "#5775C5")
                .style("stroke-width", 4);
        })
        .on("mouseout", function(d) {
            // tooltip hide
            vis.tip.hide(d);
            // unhighlight points
            vis.svg.selectAll(".point-" + vis.spaceFormat(indexData.id))
                .style("opacity", 0);
            // unhighlight lines
            vis.svg.selectAll(".line-" + vis.spaceFormat(indexData.id))
                .style("stroke", "#4B4B4B")
                .style("stroke-width", 2);
        })
        .attr("data-legend",function(d) {
            return "20" + d.FY;
        });

    dataSelection.transition();

    dataSelection.exit()
        .remove();
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