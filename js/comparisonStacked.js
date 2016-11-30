/**
 * Created by Janina on 11/24/2016.
 */

// TO DO:
// X-AXIS LABELS need to be rotated!

Co2Savings = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;

    console.log(this.data);

    this.initVis();
};


Co2Savings.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 30, right: 10, bottom: 60, left: 100};

    vis.width = 700 - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom,
        vis.offset = 50;

    // SVG drawing area
    vis.svg = d3.select("#co2-Savings")
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    // Scales and axes
    vis.x = d3.scale.ordinal()
        .rangeRoundBands([0, vis.width], 0.2);
        //.domain(vis.displayData.map(function (d) {return d.key; } ));

    vis.y = d3.scale.linear()
        .range([vis.height, 0]);

    // vis.z = d3.scaleOrdinal()
    //     .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    //
    // vis.stack = d3.stack();

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left")
        .ticks(10);


    //tool tip
    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "Plant: " + "<span style='color:#bdbdbd'>" + d.key + "<br>" + "</span>" +
                 "<br>" + "<span style='color:#bdbdbd'>" +  d[vis.category] + "<br>"+
                "<br>"+ "</span>" + "Years in pilot: " + "<span style='color:#bdbdbd'>" + d.num_years +"</span>";
        });

    vis.svg.call(vis.tip);

    vis.svg.append("g")
         //.attr("class", "x-axis axis")
         //.attr("transform", "translate(0," + vis.height + ")")
        //.attr("transform", "rotate(-65)")
    //     .call(vis.xAxis)
        // .selectAll("text")
        //     .style("text-anchor", "end")
        //     .attr("transform", "rotate(-65)");

    vis.svg.append("g")
        .attr("class", "y-axis axis")
        .attr("transform", "translate(0," + vis.width + ")")
        .call(vis.yAxis);

    //TITLE, Y-AXIS AND LABELS: PUT at the end of this
    vis.xAxisGroup = vis.svg.select(".x-axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis);

    vis.yAxisGroup = vis.svg.select(".y-axis")
        .call(vis.yAxis);

    vis.svg.select("text.axis-title").remove();

    vis.svg.append("text")
        .attr("class", "label x-label")
        .attr("x", vis.width/2)
        .attr("y", vis.height + vis.offset)
        .style("text-anchor", "end")
         .text("Plant Facilities");

    vis.svg.append("text")
        .attr("class", "label y-label")
        .attr("x", -(vis.height / 2))
        .attr("y", -(vis.offset * 1.5))
        .attr("transform", "rotate(-90)");
        //.text("CO2 Emissions"); // this needs to be updated when selection is updated

    vis.wrangleData();
}


/*
 * Data wrangling
 */


Co2Savings.prototype.wrangleData = function() {
    var vis = this;

    //console.log(vis.tip);

    vis.displayData = vis.data;
    vis.svg.call(vis.tip);

    //console.log(vis.displayData);  //unsorted

    vis.category = d3.select("#ranking-type").property("value");
    //console.log(vis.category);

    vis.displayData.sort(function (x, y) {
        return y[vis.category] - x[vis.category]
    });

    d3.select("#ranking-type").on("change", function (d) {
        //Get the current selection
        var selection = d3.select("#ranking-type").property("value");
        console.log("this is the " + selection);

        vis.displayData.sort(function (a, b) {
            return b[selection] - a[selection]
        });

        //console.log(vis.displayData); //sorted

        vis.updateVisualization()
    });
    vis.updateVisualization()
}


// Render visualization

Co2Savings.prototype.updateVisualization = function() {

        var vis = this;

        //console.log(vis.tip);
        vis.displayData = vis.data;

        vis.svg.call(vis.tip);

        //console.log(vis.displayData); //sorted

        vis.y.domain([0, d3.max(vis.displayData, function (d) {
        return d[vis.category];
    }) ]);

    // vis.displayData.sort(function(a,b) {
    //     return a
    // })

        var selection = d3.select("#ranking-type").property("value");
        //console.log("THIS IS THE " + selection);

        vis.x.domain(vis.displayData.map(function (d) {
           // return d[selection];
            return d.key;
            }
        ));


        vis.y.domain([0, d3.max(vis.displayData, function (d) {
            return d[selection];
        })
        ]);

        vis.svg.selectAll(".bar")
            .data(vis.displayData)
            .enter()
            .append("rect")
            .attr("class", "bar")
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
            .on('mouseover', vis.tip.show)
            .on('mouseout', function(d, index) { vis.tip.hide(d)});
    ;


        vis.svg.select(".y-axis")
            .call(vis.yAxis);

        vis.svg.select(".x-axis")
            .call(vis.xAxis);

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
            // .attr("x", function (d) {
            //     return vis.x(d[selection]);
            // })
            .attr("y", function (d) {
                return vis.y(d[selection]);
            })
            .attr("width", vis.x.rangeBand())
            .attr("height", function (d) {
                return vis.height - vis.y(d[selection]);
            })
            .transition()
            .delay(800)


    }

