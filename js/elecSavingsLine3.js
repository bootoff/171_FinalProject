// SVG drawing area
var margin = {top: 40, right: 40, bottom: 60, left: 60};
var width = 600 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    offset = 50;
var svg = d3.select("#line-chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("class", "line-chart")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// ------------------ GLOBAL VARIABLES AND HELPER FUNCTIONS ------------------


// date parser (https://github.com/mbostock/d3/wiki/Time-Formatting)
var formatDate = d3.time.format("%Y");

// format axis labels (http://stackoverflow.com/questions/4878756/javascript-how-to-capitalize-first-letter-of-each-word-like-a-2-word-city)
function varFormat(string) {
    string = string.replace(/_/g," ");
    return string.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// global data || global currSelection || call loadData
var rawData,
    sortedData;
var currSelection = "KwH";
loadData();

// scale functions
var x = d3.time.scale()
    .range([0, width]);
var y = d3.scale.linear()
    .range([height, 0]);

// axis functions
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

// axis groups || (initial) axis labels
var xAxisGroup = svg.append("g")
    .attr("class", "axis x-axis")
    .attr("transform", "translate(0, " + height + ")");
var yAxisGroup = svg.append("g")
    .attr("class", "axis y-axis");
xAxisGroup.append("text")
    .attr("class", "axis-label")
    .attr("id", "x-label")
    .attr("x", (width / 2))
    .attr("y", offset)
    .text("Year");
yAxisGroup.append("text")
    .attr("class", "axis-label")
    .attr("id", "y-label")
    .attr("x", -(height / 2))
    .attr("y", -offset)
    .attr("transform", "rotate(-90)")
    .text("Electricity Savings");



// initialize tooltip || call tooltip
tooltip = d3.tip().html(function(d) { return "Electricity Savings" +":"+ d.SavingsKWh; }).attr("class", "d3-tip");
        svg.call(tooltip);
svg.call(tooltip);


// return a single data point based on selection box choice
function dataReturn(d) {
    if (currSelection == "KwH")
        return d.SavingsKWH;
    else if (currSelection == "USD")
        return d.SavingsUSD;
}


// ------------------------------ DRAWING THE VIZ ------------------------------


// load CSV file
function loadData() {
    d3.csv("data/linechart.csv", function (error, csv) {
        csv.forEach(function (d) {
            // convert to 'date object' || numify strings
            d.FY = formatDate.parse(d.FY);
            d.Facility = +d.Facility;
            d.Type = +d.Type;
        });

        // store loaded data
        rawData = csv;
        sortedData = csv;

        // draw visualization for the first time
        updateVisualization();
    });
}

select()
// listen to selection box
function select(){
d3.select("#y-var").on("change", function() {
    // get selection and update visualization
    currSelection = d3.select("#y-var").property("value");
    updateVisualization();
});
}
// render visualization
function updateVisualization() {
	// scale function domains
    var dateExtent = d3.extent(sortedData, function(d) {
        return d.FY;
    });
    var yMax = d3.max(sortedData, function(d) {
        return dataReturn(d);
	});
    x.domain(dateExtent);
	y.domain([0, yMax]);

    // draw line graph || draw data points
    svg.selectAll(".line")
        .remove();
    updateLine();
    updatePoints();

    // update axes
    svg.select(".x-axis")
        .call(xAxis);
    svg.select(".y-axis")
        .transition()
        .duration(800)
        .call(yAxis);


    // update y-axis label
    //document.getElementById("y-label").innerHTML = varFormat(currSelection);
}

// render line graph
function updateLine() {
    // data join
    var dataSelection = d3.select(".line-chart")
        .selectAll(".line")
        .data(sortedData);

    // enter
    dataSelection.enter()
        .append("path")
        .attr("class", "line");

    // line function || function call
    var drawLine = d3.svg.line()
        .x(function(d) {
            return x(d.FY);
        })
        .y(function(d) {
            return y(dataReturn(d));
        })
        .interpolate("linear");


    dataSelection
        .transition()
        .delay(700)
        .duration(800)
        .attr("d", drawLine(sortedData));

    // exit
    dataSelection.exit()
        .remove();
}

// render tooltip points
function updatePoints() {
    // data join
    var dataSelection = d3.select(".line-chart")
        .selectAll(".tooltip-circle")
        .data(sortedData);

    // enter
    dataSelection.enter()
        .append("circle")
        .attr("class", "tooltip-circle")
        .attr("r", 5)
        .on("mouseover", tooltip.show)
        .on("mouseout", tooltip.hide)


    // update tooltip circles
    dataSelection
        .transition()
        .duration(800)
        .attr("cx", function(d) {
            return x(d.FY);
        })
        .attr("cy", function(d) {
            return y(dataReturn(d));
        });
console.log("print")
    // exit
    dataSelection.exit()
        .remove();
}


