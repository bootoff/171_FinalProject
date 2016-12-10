/**
 * Created by Janina on 11/24/2016.
 */

// to do: x axis
// color bars by years in project (4, 5, or 6)

Co2Savings = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;

    //console.log(this.data);

    this.initVis();
};

//Initialization:

Co2Savings.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 30, right: 10, bottom: 60, left: 100};

    vis.width = 700 - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom,
        vis.offset = 50;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.scale.ordinal()
        .rangeRoundBands([0, vis.width], 0.2);

    vis.y = d3.scale.linear()
        .range([vis.height, 0]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    //THIS IS NOT WORKING:
    vis.AxisGroup = vis.svg.append("g")
        .attr("class", "x-axis group")
        //.call(vis.xAxis)
        .attr("transform", "translate(0," + vis.height + ")rotate(-65)");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left")
        .ticks(12);

    vis.yAxisGroup = vis.svg.append("g")
        .attr("class", "y axis group")
        //.call(vis.yAxis);

    vis.svg.append("text")
        .attr("class", "label x-label")
        .attr("x", vis.width/2)
        .attr("y", vis.height + vis.offset)
        .style("text-anchor", "end")
        .text("Plant Facilities");

    //Tool tip
    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "Plant: " + "<span style='color:#bdbdbd'>" + d.key + "<br>" + "</span>" +
                 "<br>" + "<span style='color:#bdbdbd'>" +  d[vis.category] + "<br>"+
                "<br>"+ "</span>" + "Years in pilot: " + "<span style='color:#bdbdbd'>" + d.num_years +"</span>";
        });

    vis.svg.call(vis.tip);

    vis.wrangleData();
}


// Data wrangling:

Co2Savings.prototype.wrangleData = function() {
    var vis = this;

    vis.displayData = vis.data;
    vis.svg.call(vis.tip);

    vis.category = d3.select("#ranking-type").property("value");

    vis.displayData.sort(function (x, y) {
        return y[vis.category] - x[vis.category]
    });

    d3.select("#ranking-type").on("change", function (d) {
        //Get the current selection
        //var selection = d3.select("#ranking-type").property("value");
	vis.category = d3.select("#ranking-type").property("value");
        console.log("this is the " + vis.category);

        vis.displayData.sort(function (a, b) {
            return b[vis.category] - a[vis.category]
        });

        vis.updateVisualization()
    });
    vis.updateVisualization()
}


// Render/Update visualization

Co2Savings.prototype.updateVisualization = function() {

        var vis = this;

        vis.displayData = vis.data;

        vis.svg.call(vis.tip);

        var selection = d3.select("#ranking-type").property("value");

        vis.x.domain(vis.displayData.map(function (d) {
            return d.key;
            }
        ));

        vis.y.domain([0, d3.max(vis.displayData, function (d) {
            return d[vis.category];
        })
        ]);


       vis.colorScale = d3.scale.ordinal()
            .domain(["foo", "bar", "baz"])
            .range(colorbrewer.YlGnBu[3]);

        vis.svg.selectAll(".bar")
            .data(vis.displayData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .style("fill", function(d) {
                return vis.colorScale(d.num_years);
            })
            .attr("x", function (d) {
                return vis.x(d.key);
            })
            .attr("width", vis.x.rangeBand())
            .attr("width", 10)
            .attr("y", function (d) {
                return vis.y(d.savings_USD_sum)
            })
            .attr("height", function (d) {
                return vis.height - vis.y(d.savings_USD_sum);
            })
            .attr("data-legend",function(d) {
                return  d.num_years + " yr total";
            })
            .on("mouseover", function(d, index) {
                d3.select(this)
                    .style("fill", "#8DB500");
                vis.tip.show(d);
            })
            .on('mouseout', function(d, index) {
                d3.select(this)
                    .style("fill", function(d) {
                    return vis.colorScale(d.num_years);
                });
                vis.tip.hide(d)});

    //attribute data-legend-pos
    
    vis.legend = vis.svg.append("g")
        .attr("class","legend")
        .attr("transform","translate(500,10)")
        .style("font-size","12px")
        .call(d3.legend);

        var rect = vis.svg.selectAll("rect")
            .data(vis.displayData);

        rect.enter().append("rect")
            .attr("class", "bar")
            .on('mouseover', vis.tip.show)
            .on('mouseout', function(d, index) { vis.tip.hide(d)});

        rect.exit().remove();

        rect
            .transition()
            .duration(800)
            .attr("y", function (d) {
                return vis.y(d[vis.category]);
            })
            .attr("width", vis.x.rangeBand())
            .attr("height", function (d) {
                return vis.height - vis.y(d[vis.category]);
            })
            .transition()
            .delay(800);

    vis.svg.select(".y.axis.group")
	.transition()
	.duration(250)
	.call(vis.yAxis);

    vis.svg.select(".x.axis.group")
	.transition()
	.duration(250)
	.call(vis.xAxis);
    

}
