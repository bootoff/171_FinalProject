/*
 *  Author: Matt Holman
 *
 *  Based on lab10 concept.
 */

var cellHeight = 20, cellWidth = 20, cellPadding = 5;

var label = {"savingsUSD" : "USD",
	     "ElectricityGenerationKWh": "KWh",
	     "GHG" : "tons"};

var standoutColor = "brown", moneyColor="#006837", electricityColor="#8856a7", GHGColor='#08519c';

var squareColor = {"savingsUSD" : moneyColor,
		   "ElectricityGenerationKWh": electricityColor,
		   "GHG" : GHGColor};

var tbarColor = {"savingsUSD" : moneyColor,
		 "ElectricityGenerationKWh": moneyColor,
		 "GHG" : moneyColor};



//"red"};

//['#deebf7','#9ecae1','#3182bd']


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

    vis.width = 1000 - vis.margin.left - vis.margin.right,
    vis.height = 1000 - vis.margin.top - vis.margin.bottom;

    vis.alphabetical = true;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
	.attr("width", vis.width + vis.margin.left + vis.margin.right)
	.attr("height", vis.height + vis.margin.top + vis.margin.bottom);

    vis.svg.append("text")
	.attr("text-anchor", "middle")
    	.attr("transform", "translate(450,20)")    
	.attr("class", "y axis-title")
    	.text("Facility")

    vis.svg.append("text")
	.attr("text-anchor", "middle")
    	.attr("transform", "translate(10,542)")    
	.attr("class", "x axis-title")
    	.text("FY")

    vis.svg.append("text")
	.attr("text-anchor", "middle")
    	.attr("transform", "translate(450,555)")    
	.attr("class", "h axis-title")
    	.text("USD")

        vis.svg.append("text")
	.attr("text-anchor", "middle")
    	.attr("transform", "translate(320,555)")    
	.attr("class", "v axis-title")
    	.text("USD")

    // Button for changing the selection type
    d3.select("#squares-type").on("change", function(){
	vis.category = d3.select("#squares-type").property("value");
	$(vis.eventHandler).trigger("selectionChanged", vis.category);
    });

        // Button for changing the selection type
    d3.select("#squares-sort").on("click", function(){
	vis.alphabetical = !vis.alphabetical;
	$(vis.eventHandler).trigger("selectionChanged", vis.category);
        d3.select(this).html(vis.alphabetical ? "values" : "names " );
    })

    vis.tip = d3.tip()
	.attr('class', 'd3-tip')
	.offset([-20, 0])
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

    vis.cMin = d3.min(nonZero,
			function(d){
			    return +d[vis.category];
			});
    
    vis.x = d3.scale.linear()
        .domain([vis.minFY, vis.maxFY])
        .range([0, (vis.maxFY-vis.minFY)*(cellWidth+cellPadding)]);

    vis.hbarlength = d3.scale.linear()
        .range([0, 200]);  // need to fix this

    vis.vbarlength = d3.scale.linear()
        .range([0, 200]);  // need to fix this
    
    var mySet = new Set();
    vis.displayData.forEach(function(d){ mySet.add(d.Facility); });
    var facilities = Array.from(mySet);

    vis.y = d3.scale.ordinal()
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
	.tickFormat(function (d) {
            return "\'" + d3.format("02")(d);
    })    
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("right");

    vis.hAxis = d3.svg.axis()
        .scale(vis.hbarlength)
        .orient("bottom");

    vis.vAxis = d3.svg.axis()
        .scale(vis.vbarlength)
        .orient("right");
    
    vis.nested = d3.nest()
        .key(function (d) {
            return d.Facility;
        })
	.sortKeys(d3.ascending)
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

    var transposed = {};
    var years = vis.nested[0].values.map(function(d){return d.FY});
    years.forEach(function(yr){ transposed[yr] = []});
    years.forEach(function(yr){
	vis.nested.forEach(function(d2){
	    d2.values.filter(function(x){return x.FY == yr}).forEach(function(y){transposed[yr].push(y)});
	});
    });

    var FYDict = {};
    Object.keys(transposed).forEach(function(ky){
	var elt = {};
	Object.keys(label).forEach(function(d2){
	    elt[d2] = {"sum": d3.sum(transposed[ky].map(function(d){return d[d2]})),
		       "max": d3.max(transposed[ky].map(function(d){return d[d2]})), }
	});
	FYDict[ky] = elt;
    });

    var FYArray = [];
    for(var ky in FYDict){
	FYArray.push({"key": ky, "value": FYDict[ky]});
    }

    vis.FYArray = FYArray;
    

    var facilityDict = {};
    vis.nested.forEach(function(d){
	var elt = {};
	Object.keys(label).forEach(function(d2){
	    elt[d2] = {"sum": d3.sum(d.values.map(function(x){return x[d2]})), "max": d3.max(d.values.map(function(x){return x[d2]}))}
	});
	facilityDict[d.key] = elt;
    });

    var facilityArray = [];
    for(var ky in facilityDict){
	facilityArray.push({"key": ky, "value": facilityDict[ky]});
    }

    vis.facilityArray = facilityArray;

    for(var i=0; i<projects_nested.length; i++){
	for(var key in projects_nested[i].values){
	    vis.facilityArray[i].value[key] = projects_nested[i].values[key];
	}
    }

    // sorting arrays
    if(!vis.alphabetical){
	vis.facilityArray.sort(function(a, b){return a.value[vis.category].sum - b.value[vis.category].sum });
	vis.nested.sort(function(a, b) { return facilityDict[a.key][vis.category].sum - facilityDict[b.key][vis.category].sum });
    }else{
	vis.facilityArray.sort(function(a, b){return (a.key>b.key) ? 1 : -1 });
	vis.nested.sort(function(a, b) {return (a.key>b.key) ? 1 : -1 });
    }


    vis.y.domain(    vis.facilityArray.map(function(a){ return a.key}));
    vis.hbarlength.domain([0, d3.max(vis.facilityArray,
				     function(d){
					 if(vis.category == "savingsUSD"){
					     return d.value["totalCostUSD"];
					 }else{
					     return d.value[vis.category].sum;					 
					 }
				     })]);
    vis.vbarlength.domain([0, d3.max(vis.FYArray, function(d){return d.value[vis.category].sum})]);    
    vis.vbarlength.domain([0, d3.max(vis.FYArray, function(d){return d.value[vis.category].sum})]);    


    var rows = vis.svg.selectAll(".row")
	.data(vis.nested);

    rows.enter()
	.append("g")
	.attr("transform", function(d, index) {
	    return "translate(" + vis.margin.left + "," + (vis.margin.top + (cellHeight + cellPadding) * index) + ")"
	})
	.attr("class", function(d, index){ return "row row-"+ vis.spaceFormat(d.key);})

    vis.svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(" + (vis.margin.left + (cellWidth+cellPadding)*0.5) + "," + (cellHeight + cellPadding)*21 + ")")
	.call(vis.xAxis);

    vis.svg.append("g")
        .attr("class", "y axis")
	//.attr("transform", "translate(" + (vis.margin.left) + ", " + (cellHeight+cellPadding)*(21*0.5) + ")")    
	.attr("transform", "translate(" + (cellWidth+cellPadding)*11 + ", 18)")
	.append("text")

    vis.svg.append("g")
	.attr("class", "h axis")
	.attr("transform", "translate(" + (vis.margin.left + 470) + "," + ((cellHeight + cellPadding)*20 +30 ) + ")")

    vis.svg.append("g")
        .attr("class", "v axis")
    	.attr("transform", "translate(" + (cellWidth+cellPadding)*11 + "," + (vis.margin.top + (cellHeight + cellPadding)*20 +30 ) + ")")
    

    // Update the visualization
    vis.updateVis();
    
}

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

SquaresChart.prototype.updateVis = function(){
    var vis = this;
    /*
    */

    //console.log(vis.facilityArray);
    
    // Draw horizontal bars
    var hbars = vis.svg.selectAll(".hbar").remove();

    hbars = vis.svg.selectAll(".hbar")
	.data(vis.facilityArray);
    
    hbars.enter()
	.append("g")
	.attr("transform", function(d, index) {
	    return "translate(" + (vis.margin.left + 470) + "," + (vis.margin.top + (cellHeight + cellPadding) * index) + ")"
	})
	.append("rect")
	.attr("class", function(d, index){ return "hbar hbar-"+ vis.spaceFormat(d.key);})    
	.style("fill", squareColor[vis.category])
	.attr("x", 0)
	.attr("y", -cellHeight*0.25)
	.attr("height", cellHeight*0.5)
	.attr("width", function(d){ return vis.hbarlength(d.value[vis.category].sum)})
	.style("opacity", function(d, i, j){ return vis.opacity(d[vis.category]) })	    	    
        .on('mouseover', function(d, index){
            d3.select(this).style("fill", function(d){ return standoutColor});
	    var theSquares = d3.selectAll(".square-"+vis.spaceFormat(d.key));
	    var tmpOpacity = d3.scale.linear()
		.domain([0, d.value[vis.category].max])
		.range([0.05, 1.0]);
	    theSquares
		.style("fill", function(x){ return standoutColor})
		.style("opacity", function(x){ return tmpOpacity(x[vis.category])});
	})
        .on("mouseout", function(d, i) {
            d3.select(this).style("fill", function(d, index) {
		return (+d[vis.category]==0) ? "gray" : squareColor[vis.category];});
	    var theSquares = d3.selectAll(".square-"+vis.spaceFormat(d.key));	    
	    theSquares
		//.style("fill", function(x){ return squareColor[vis.category]})
		.style("fill", function(d){ return (+d[vis.category]==0) ? "gray" : squareColor[vis.category];})	    
		.style("opacity", function(d, i, j){ return vis.opacity(d[vis.category]) })	    	    	    
	});

    // Update
    hbars
	.transition()
        .duration(250)
	.style("fill", squareColor[vis.category])    
	.attr("width", function(d){ return vis.hbarlength(d.value[vis.category].sum)})

    // Draw horizontal total bars
    var tbars = vis.svg.selectAll(".tbar").remove();

    tbars = vis.svg.selectAll(".tbar")
	.data(vis.facilityArray);
    
    tbars.enter()
	.append("g")
	.attr("transform", function(d, index) {
	    return "translate(" + (vis.margin.left + 470) + "," + (vis.margin.top + (cellHeight + cellPadding) * index) + ")"
	})
	.append("rect")
	.attr("class", function(d, index){ return "tbar tbar-"+ vis.spaceFormat(d.key);})    
	.style("fill", tbarColor[vis.category])
	.attr("x", 0)
	.attr("y", +cellHeight*0.25)
	.attr("height", cellHeight*0.5)
	.attr("width", function(d){ return vis.hbarlength(d.value["totalCostUSD"])})
	.style("opacity", function(d, i, j){ return vis.opacity(d[vis.category]) })	    	    
        .on('mouseover', function(d, index){
            d3.select(this).style("fill", function(d){ return standoutColor});
	    var theSquares = d3.selectAll(".square-"+vis.spaceFormat(d.key));
	    var tmpOpacity = d3.scale.linear()
		.domain([0, d.value[vis.category].max])
		.range([0.05, 1.0]);
	    theSquares
		.style("fill", function(x){ return standoutColor})
		.style("opacity", function(x){ return tmpOpacity(x[vis.category])});
	})
        .on("mouseout", function(d, i) {
            d3.select(this).style("fill", function(d, index) {
		return (+d[vis.category]==0) ? "gray" : tbarColor[vis.category];});
	    var theSquares = d3.selectAll(".square-"+vis.spaceFormat(d.key));	    
	    theSquares
		//.style("fill", function(x){ return squareColor[vis.category]})
		.style("fill", function(d){ return (+d[vis.category]==0) ? "gray" : squareColor[vis.category];})	    
		.style("opacity", function(d, i, j){ return vis.opacity(d[vis.category]) })	    	    	    
	});

    // Update
    tbars
	.transition()
        .duration(250)
	.style("fill", squareColor[vis.category])    
	.attr("width", function(d){ return vis.hbarlength(d.value["totalCostUSD"])})
    
    // Draw vertical bars
    var vbars = vis.svg.selectAll(".vbar")
	.data(vis.FYArray);

    vbars.enter()
	.append("g")
	.attr("transform", function(d, index) {
	    return "translate(" + (vis.margin.left + (cellWidth + cellPadding) * index) + "," + (vis.margin.top + (cellHeight + cellPadding) * 20 + 30) + ")"
	})
	.append("rect")
	.attr("class", function(d, index){ return "vbar vbar-"+ d.key;})        
	.style("fill", squareColor[vis.category])
	.attr("x", 0)
	.attr("y", 0)
	.attr("height", function(d){ return vis.vbarlength(d.value[vis.category].sum)})
	.attr("width", cellWidth)
        .on('mouseover', function(d, index){
            d3.select(this).style("fill", function(d){ return standoutColor});
	    var theSquares = d3.selectAll(".square-"+vis.spaceFormat(d.key));
	    var tmpOpacity = d3.scale.linear()
		.domain([0, d.value[vis.category].max])
		.range([0.05, 1.0]);
	    theSquares
		.style("fill", function(x){ return standoutColor})
		.style("opacity", function(x){ return tmpOpacity(x[vis.category])});
	})
        .on("mouseout", function(d, i) {
            d3.select(this).style("fill", function(d, index) {
		return (+d[vis.category]==0) ? "gray" : squareColor[vis.category];});
	    var theSquares = d3.selectAll(".square-"+vis.spaceFormat(d.key));
	    theSquares
		.style("fill", function(d){ return (+d[vis.category]==0) ? "gray" : squareColor[vis.category];})	    
		.style("opacity", function(d, i, j){ return vis.opacity(d[vis.category]) })	    	    	    
	})
    
    // Update
    vbars
	.transition()
        .duration(250)
	.style("fill", squareColor[vis.category])    
	.attr("height", function(d){ return vis.vbarlength(d.value[vis.category].sum)})    
    
    // Draw squares

    var squares = vis.svg.selectAll(".row")
	.data(vis.nested)
	.selectAll(".square")
	.data(function(d, i) { return d.values; });

    squares.enter()
	.append("rect")
	.attr("x", function(d, i, j) { return (cellWidth + cellPadding) * i; })
	.attr("y", 0)
	.attr("height", cellHeight)
    	.attr("width", cellHeight)
	.attr("class", function(d, index){ return "square square-"+ d.FY + " square-"+vis.spaceFormat(d.Facility);})
	.style("fill", function(d){ return (+d[vis.category]==0) ? "gray" : squareColor[vis.category];})
	.style("stroke-opacity", 0.5)
	.style("opacity",
	       function(d, i, j){
		   return (+d[vis.category]==0) ? 0.05 : vis.opacity(d[vis.category]);
	       });

    squares
	//.attr("class", "square")
	.attr("class", function(d, index){ return "square square-"+ d.FY + " square-"+vis.spaceFormat(d.Facility);})    
	.style("fill", function(d){ return (+d[vis.category]==0) ? "gray" : squareColor[vis.category];})
	.style("stroke-opacity", 0.5)
	.style("opacity",
	       function(d, i, j){
		   return (+d[vis.category]==0) ? 0.05 : vis.opacity(d[vis.category]);
	       })
	.attr("x", function(d, i, j) { return (cellWidth + cellPadding) * i; })
	.attr("y", 0)
	.attr("height", cellHeight)
    	.attr("width", cellHeight)
        .on('mouseover', function(d, index){
	    vis.tip.show(d);	    
            d3.select(this).style("fill", standoutColor);
	    d3.select(".hbar-"+vis.spaceFormat(d.Facility)).style("fill", function(x){ return standoutColor});
	    //d3.select(".tbar-"+vis.spaceFormat(d.Facility)).style("fill", function(x){ return standoutColor});	    
	    d3.select(".vbar-"+d.FY).style("fill", function(x){ return standoutColor})
	})
        .on("mouseout", function(d, i) {
	    vis.tip.hide(d);	    
            d3.select(this).style("fill", function(d, index) {
		return (+d[vis.category]==0) ? "gray" : squareColor[vis.category];});
	    d3.select(".vbar-"+d.FY).style("fill", function(x){ return squareColor[vis.category]});
	    //d3.select(".tbar-"+vis.spaceFormat(d.Facility)).style("fill", function(x){ return squareColor[vis.category]})
	    d3.select(".hbar-"+vis.spaceFormat(d.Facility)).style("fill", function(x){ return squareColor[vis.category]})
	})
    
    
    vis.svg.select(".h.axis")
    	.call(vis.hAxis)
	.selectAll("text")
	.attr("y", 4)
	.attr("x", 8)    
        .attr("transform", "rotate(45)")
	.style("text-anchor", "start");    

    vis.vbarlength.domain([0, d3.max(vis.FYArray, function(d){return d.value[vis.category].sum})]);    

    vis.svg.select(".v.axis")
    	.transition()
	.duration(250)
        .call(vis.vAxis)

    vis.svg.select(".y.axis")
	.transition()
	.duration(250)
	.call(vis.yAxis);

    vis.svg.select(".h.axis-title")
	.text(label[vis.category]);

    vis.svg.select(".v.axis-title")
	.text(label[vis.category]);
    
};

SquaresChart.prototype.onSelectionChange = function(category){
    var vis = this;


    // Filter data depending on selected time period (brush)
    vis.category = d3.select("#squares-type").property("value");
    vis.category = category;

    vis.wrangleData();
};

// remove non-selector characters from strings
// borrowed from Alma
SquaresChart.prototype.spaceFormat = function(str) {
    str = str.replace(/\s+/g, '_');
    str = str.replace("(", '-');
    str = str.replace(")", '');
    return str;
};
