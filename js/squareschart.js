/*
 *  Author: Matt Holman
 *
 *  Based on lab10 concept.
 */

var cellHeight = 20, cellWidth = 20, cellPadding = 5;

var label = {"savingsUSD" : "USD",
	     "ElectricityGenerationKWh": "KWh",
	     "GHG" : "tons"};



/*
 * SquaresChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data			-- the dataset 
 */

SquaresChart = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;
    this.eventHandler = _eventHandler;
    this.initVis();
};

/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */

SquaresChart.prototype.initVis = function(){
    var vis = this;

    // * TO-DO *
    vis.margin = { top: 20, right: 0, bottom: 20, left: 20 };

    vis.width = 700 - vis.margin.left - vis.margin.right,
    vis.height = 700 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
	.attr("width", vis.width + vis.margin.left + vis.margin.right)
	.attr("height", vis.height + vis.margin.top + vis.margin.bottom);

    // Button for changing the selection type
    d3.select("#squares-type").on("change", function(){
	vis.category = d3.select("#squares-type").property("value");
	$(vis.eventHandler).trigger("selectionChanged", vis.category);
    });

    vis.tip = d3.tip()
	.attr('class', 'd3-tip')
	.offset([-10, 0])
	.html(function(d) {
            return "Plant: " + "<span style='color:#bdbdbd'>" + d.Facility + "<br>" + "</span>" +
                "<br>" + "FY: " + "<span style='color:#bdbdbd'>" +  d.FY + "<br>"+ "</span>" +
                "<br>" + label[vis.category] + ": " + "<span style='color:#bdbdbd'>" + d[vis.category].toFixed(2) + "<br>"+ "</span>";
	    //return "Plant: <span style='color:red'>" + d.Facility + "<br>" + "FY: " + d.FY + "<br>" + d[vis.category] + "</span>";
	});

    vis.svg.call(vis.tip);

    // Scales and axes

    // (Filter, aggregate, modify data)
    vis.wrangleData();
}

/*
 * Data wrangling
 */

SquaresChart.prototype.wrangleData = function(){
    var vis = this;

    vis.displayData = vis.data;

    vis.category = d3.select("#squares-type").property("value");

    vis.displayData.forEach(function(d){ d.FY = +d.FY});

    vis.maxFY = d3.max(vis.displayData, function(d){
	return +d.FY;
    });

    vis.minFY = d3.min(vis.displayData, function(d){
	return +d.FY;
    });

    vis.cMax = d3.max(vis.displayData, function(d){
	return +d[vis.category];
    });

    var nonZero = vis.displayData.filter(function(d){return +d[vis.category] > 0;});

    /*
    vis.cMin = d3.min(vis.displayData,
		      function(d){
			  return +d[vis.category];
		      });
		      */

    vis.cMin = d3.min(nonZero,
			function(d){
			    return +d[vis.category];
			});
    
    vis.x = d3.scale.linear()
        .domain([vis.minFY, vis.maxFY])
        .range([0, (vis.maxFY-vis.minFY)*(cellWidth+cellPadding)]);

    var mySet = new Set();
    vis.displayData.forEach(function(d){ mySet.add(d.Facility); });
    var facilities = Array.from(mySet);
    //console.log(facilities);

    vis.y = d3.scale.ordinal()
	.domain(facilities)
	.rangeRoundBands([0, facilities.length*(cellHeight+cellPadding)]);

    vis.opacity = d3.scale.linear()
        .domain([vis.cMin, vis.cMax])
        .range([0.05, 1.0]);

    /*
    vis.opacityNZ = d3.scale.linear()
        .domain([vis.cMinNZ, vis.cMax])
        .range([0.05, 1.0]);
	*/
    
    // axis functions
    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("right");

    vis.nested = d3.nest()
        .key(function (d) {
            return d.Facility;
        })
	.sortValues(function(a,b) { return a.FY - b.FY; })
        .entries(vis.displayData);

    vis.nested.forEach(function(d, i){

	var distinct_fy = [];
	d.values.forEach(function(d2){
	    if(!distinct_fy.includes(d2.FY)){
		distinct_fy.push(d2.FY);
	    }
	});

	var Facility = d.values[0].Facility;
	var Type = d.values[0].Type;	
	for(var j=vis.minFY; j<=vis.maxFY; j++){
	    if(!distinct_fy.includes(j)){
		vis.nested[i].values.push(
		    {"FY": j,
		     "Facility": Facility,
		     "Type": Type,
		     "ElectricityGenerationKWh": 0,
		     "savingsUSD": 0,		     
		     "GHG": 0,
		     "GHGlbs": 0,
		     "Rate": 0.,
		     "USDperKWh": 0,
		     "UsageKWh": 0,
		     "UsageUSD": 0
		    }
		);
		k = vis.nested[i].values.length-1;

	    }
	}

	vis.nested[i].values.sort(function(a, b){return a.FY-b.FY});
	
    });

    var rows = vis.svg.selectAll(".row")
	.data(vis.nested);

    rows.enter()
	.append("g")
	.attr("transform", function(d, index) {
	    return "translate(" + vis.margin.left + "," + (vis.margin.top + (cellHeight + cellPadding) * index) + ")"
	})
    	.attr("class", "row");

    vis.svg.append("g")
	.attr("class", "x-axis axis")
	.attr("transform", "translate(" + (vis.margin.left + (cellWidth+cellPadding)*0.5) + "," + (cellHeight + cellPadding)*21 + ")")
	.call(vis.xAxis);

    vis.svg.append("g")
        .attr("class", "y-axis axis")
	//.attr("transform", "translate(" + (vis.margin.left) + ", " + (cellHeight+cellPadding)*(21*0.5) + ")")    
	.attr("transform", "translate(" + (cellWidth+cellPadding)*11 + ", 18)")    
        .call(vis.yAxis);

    // Update the visualization
    vis.updateVis();
    
}

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

SquaresChart.prototype.updateVis = function(){
    var vis = this;

    // Draw squares

    var squares = vis.svg.selectAll(".row")
	.data(vis.nested)
	.selectAll(".square")
	.data(function(d, i) { return d.values; });

    squares.enter()
	.append("rect")
	//.on("mouseover", function(d, i, j){ console.log("row: " + i, "facility: ", d.Facility, "column: " + j, "FY: ", d.FY)})
        .on('mouseover', function(d, index){
            d3.select(this).style("fill", function(d){ return "green"});
	    vis.tip.show(d)})
        .on("mouseout", function(d, i) {
            d3.select(this).style("fill", function(d, index) {
		return (+d[vis.category]==0) ? "gray" : "red";});
	    vis.tip.hide(d)})
	.attr("class", "square")
	.style("fill", "gray")
	.style("stroke-opacity", 0.5)
	.style("opacity", function(d, i, j){ return vis.opacity(d[vis.category]) })
	.attr("x", function(d, i, j) { return (cellWidth + cellPadding) * i; })
	.attr("y", 0)
	.attr("height", cellHeight)
    	.attr("width", cellHeight);

    squares
	.attr("class", "square")
	.style("fill", function(d){ return (+d[vis.category]==0) ? "gray" : "red";})
	.style("stroke-opacity", 0.5)
	.style("opacity",
	       function(d, i, j){
		   return (+d[vis.category]==0) ? 0.05 : vis.opacity(d[vis.category]);
	       })
	.attr("x", function(d, i, j) { return (cellWidth + cellPadding) * i; })
	.attr("y", 0)
	.attr("height", cellHeight)
    	.attr("width", cellHeight);

};

SquaresChart.prototype.onSelectionChange = function(category){
    var vis = this;


    // Filter data depending on selected time period (brush)

    vis.category = category;

    vis.wrangleData();
};