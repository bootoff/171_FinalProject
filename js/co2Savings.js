//
//co2Savings = new co2Savings("co2-Savings", GHGsum);
//console.log("Janina");


co2Savings = function(_parentElement, _GHGsum){
    this.parentElement = _parentElement;
    this.GHGsum = _GHGsum;

    this.initVis();
};

co2Savings.prototype.initVis = function() {

    var vis = this;

    vis.margin = {top: 40, right: 0, bottom: 60, left: 60};

    vis.width = 800 - vis.margin.left - vis.margin.right,
        vis.height = 800 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
}
    // Scales and axes
    // vis.x = d3.scale.ordinal()
    //     .rangeRoundBands([0, vis.width])
    //    // .domain(d3.extent(vis.GHGsum, function(d) { //// })); // WORK THIS OUT
    //
    // vis.y = d3.scale.linear()
    //     .range([0, vis.height])
    //     //.domain([0, d3.max(this.GHGsum, function(d) { //// ;})]); // WORK THIS OUT
    //
    // vis.xAxis = d3.svg.axis()
    //     .scale(vis.x)
    //     .orient("bottom");
    //
    // vis.yAxis = d3.svg.axis()
    //     .scale(vis.y)
    //     .orient("left");
    //
    // vis.svg.append("g")
    //     .attr("class", "x-axis axis")
    //     .attr("transform", "translate(0," + vis.height + ")")
    //     .call(vis.xAxis);
    //
    // vis.svg.append("g")
    //     .attr("class", "y-axis axis")
    //     .attr("transform", "translate(0," + vis.width + ")")
    //     .call(vis.yAxis);

    //JM TO DO: TITLE, Y-AXIS AND LABELS



// JM: INITIALIZE TOOLTIP HERE


    // (Filter, aggregate, modify data)
    //vis.wrangleData();
//};


/*
 * Data wrangling
 */

// co2Savings.prototype.wrangleData = function(){
//     var vis = this;
//
//     // (1) Group data by key variable (e.g. 'electricity') and count leaves
//     vis.nestedData = d3.nest()
//         .key(function(d) { return this.config; })
//         .rollup(function(leaves) { return leaves.count; })
//         .entries(this.displayData);
//
//     vis.nestedData.forEach(function(d) {
//         d.value = +d.value;
//     });
//
//     // (2) Sort columns descending
//
//     // * TO-DO *
//
//     // Update the visualization
//     vis.updateVis();
// }
