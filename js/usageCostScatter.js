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

    // initialize tooltip
    vis.tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10,0])
        .html(function(d) {
            return d.Facility + "<br/>" + vis.formatYear(d.FY) + "<br/>" + d.UsageKWh  + " KWh<br/>$" + d.UsageUSD;
        });
    vis.svg.call(vis.tip);

    // draw axis labels
    vis.svg.append("text")
        .attr("class", "label x-label")
        .attr("x", (vis.width / 2))
        .attr("y", vis.height + vis.offset)
        .text("Usage (KWh)");
    vis.svg.append("text")
        .attr("class", "label y-label")
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
    // var yearExtent = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];
    vis.x = d3.scale.linear()
        .domain([0, usageKWhMax])
        .range([0, vis.width]);
    vis.y = d3.scale.linear()
        .domain([0, (usageCostMax + 100000)])
        .range([vis.height, 0]);
    /*vis.colorScale = d3.scale.category10()
        .domain(yearExtent);*/
    vis.colors = [
        ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4'], //0
        ['#41ae76','#238b45','#006d2c','#00441b','#00200D'],
        ['#f7fcfd','#e0ecf4','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#810f7c','#4d004b','#2F002E'],
        ['#f7fcf0','#e0f3db','#ccebc5','#a8ddb5','#7bccc4','#4eb3d3'],
        ['#2b8cbe','#0868ac','#084081','#062B55','#062B55','#062B55'], //4
        ['#fff7ec','#fee8c8','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#b30000','#7f0000','#520000'],
        ['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#045a8d','#023858','#012134'],
        ['#ffffff','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#161616','#000000'],
        ['#f7f4f9','#e7e1ef','#d4b9da','#c994c7','#df65b0','#e7298a','#ce1256','#980043','#67001f','#3E0013'],
        ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1'], //9
        ['#dd3497','#ae017e','#7a0177','#49006a','#000000'],
        ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0'],
        ['#225ea8','#253494','#081d58','#ffffff','#ffffff'],
        ['#ffffe5','#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#006837','#004529','#ffffff'],
        ['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#993404','#662506','#ffffff'], //14
        ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6'],
        ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#a63603','#7f2704','#ffffff'],
        ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#54278f','#3f007d','#ffffff'],
        ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c','#00441b','#ffffff'],
        ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c','#00441b','#ffffff']  //19
    ];

    // enumerate the facilities in vis.data (for use with vis.colors)
    var counter = 0;
    vis.dataRoll.forEach(function(d, i) {
        d.values.forEach(function() {
            //console.log(i);
            vis.data[counter].facilityNum = i;
            counter++;
        })
    });

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

    var facility = vis.svg.selectAll(".facility")
        .data(vis.dataRoll)
        .enter()
        .append("g")
        .attr("class", function(d) {
            return "facility facility-" + vis.spaceFormat(d.id);
        })
        .style("display", "none");

    // draw (hidden) lines
    facility.append("path")
        .attr("class", "line")
        .transition()
        .attr("d", function(d) {
            return vis.drawLine(d.values);
        });

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
            // return vis.colorScale(d.FY);
            return vis.colors[d.facilityNum][(d.FY - 7)];
        })
        .attr("data-legend",function(d) {
            return "20" + d.FY;
        })
        .on("mouseover", function(d) {
            vis.tip.show(d);
            vis.svg.selectAll(".facility-" + vis.spaceFormat(d.Facility))
                .style("display", null);
        })
        .on("mouseout", function(d) {
            vis.tip.hide(d);
            vis.svg.selectAll(".facility-" + vis.spaceFormat(d.Facility))
                .style("display", "none");
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