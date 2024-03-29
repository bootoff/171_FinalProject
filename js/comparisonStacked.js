/**
 * Created by Janina on 11/24/2016.
 */

// to do: x axis
// color bars by years in project (4, 5, or 6)

var cat_label = {"savings_USD_sum" : "USD",
	     "totalCostUSD" : "USD",	     
	     "energy_sum": "KWh",
	     "ghg_sum" : "tons"};

Co2Savings = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;

    //console.log(this.data);

    this.initVis();
};

n_copies = function(d, n){
    var c = [];
    for(var i=0; i<d.num_years; i++){
	c.concat(d);
    }
    return c;
};

//Initialization:

Co2Savings.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 30, right: 10, bottom: 80, left: 60};

    vis.width = 700 - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom,
        vis.offset = 40;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.svg.append("text")
	.attr("text-anchor", "end")
    	.attr("transform", "translate(-15,-10)")    
	.attr("class", "y axis-title")
    	.text("USD")

    // Scales and axes
    vis.x = d3.scale.ordinal()
        .rangeRoundBands([0, vis.width], 0.2);

    vis.y = d3.scale.linear()
        .range([vis.height, 0]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.colorScale = d3.scale.category20();
    vis.colorScale = d3.scale.ordinal()
	.domain([4, 5, 6])
	.range(['#74a9cf','#2b8cbe','#045a8d']);

    vis.tcolorScale = d3.scale.ordinal()
	.domain([4, 5, 6])    
	.range(['#74c476','#31a354','#006d2c']);
    
    vis.xAxisGroup = vis.svg.append("g")
        .attr("class", "x axis group")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left")
        .ticks(12);

    vis.yAxisGroup = vis.svg.append("g")
        .attr("class", "y axis group")

    vis.svg.append("text")
        .attr("class", "label x-label")
        .attr("x", 20)
        .attr("y", vis.height + vis.offset)
        .style("text-anchor", "end")
        .text("Plant Facilities");

    //Tool tips
    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
	    if(vis.category=='totalCostUSD' || vis.category=='savings_USD_sum'){
		return "Plant: " + "<span style='color:#bdbdbd'>" + d.key + "<br>" + "</span>" +
                    "<br>" + "Savings to date: " + "<span style='color:#bdbdbd'>$" +  d['savings_USD_sum'].toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + "<br>"+
                    "<br>"+ "</span>" + "Years in pilot: " + "<span style='color:#bdbdbd'>" + d.num_years +"</span>";
	    }else{
		return "Plant: " + "<span style='color:#bdbdbd'>" + d.key + "<br>" + "</span>" +
                    "<br>" + cat_label[vis.category] + ": " + "<span style='color:#bdbdbd'>" +  d[vis.category].toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + "<br>"+
                    "<br>"+ "</span>" + "Years in pilot: " + "<span style='color:#bdbdbd'>" + d.num_years +"</span>";
	    }
	    
        });

    vis.svg.call(vis.tip);

    vis.tbartip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
	    return "Plant: " + "<span style='color:#bdbdbd'>" + d.key + "<br>" + "</span>" +
                "<br>" + "Installation cost: " + "<span style='color:#bdbdbd'>$" +  d['totalCostUSD'].toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + "<br>"+
                "<br>"+ "</span>" + "Years in pilot: " + "<span style='color:#bdbdbd'>" + d.num_years +"</span>";
        });

    vis.svg.call(vis.tbartip);
    
    d3.select("#ranking-type").on("change", function (d) {
        //Get the current selection
	vis.category = d3.select("#ranking-type").property("value");

        vis.displayData.sort(function (a, b) {
            return b[vis.category] - a[vis.category]
        });

        vis.wrangleData()
    });
    

    vis.wrangleData();
}


// Data wrangling:

Co2Savings.prototype.wrangleData = function() {
    var vis = this;

    vis.displayData = vis.data;

    vis.category = d3.select("#ranking-type").property("value");

    vis.displayData.sort(function (x, y) {
        return y[vis.category] - x[vis.category]
    });

    vis.updateVisualization()
}


// Render/Update visualization

Co2Savings.prototype.updateVisualization = function() {

    var vis = this;

    vis.x.domain(vis.displayData.map(function (d) { return d.key; } ));
    vis.y.domain([0, d3.max(vis.displayData, function (d) { return d[vis.category]; }) ]);

    var bars = vis.svg.selectAll(".bar")
        .data(vis.displayData);

    bars.enter()
    	.append("rect")
    	//.each(function(d, i){for(var j=0; j<d.num_years; j++){ console.log(i, j, d.num_years)}})
        .attr("class", "bar")
        .attr("x", function (d) {
            //return vis.x(d.key);
	    return (vis.category == 'savings_USD_sum' || vis.category == 'totalCostUSD') ? vis.x(d.key) + 0.0*vis.x.rangeBand() : vis.x(d.key) })
        .attr("y", function (d) {
            return (vis.category == 'totalCostUSD') ? vis.y(d['savings_USD_sum']): vis.y(d[vis.category]);
        })
        //.attr("width", vis.x.rangeBand())
        .attr("width", function(d){
	    return (vis.category == 'savings_USD_sum' || vis.category == 'totalCostUSD') ? 0.5*vis.x.rangeBand() : vis.x.rangeBand(); })
        .attr("height", function (d) {
            return (vis.category == 'totalCostUSD') ? vis.height - vis.y(d['savings_USD_sum']): vis.height - vis.y(d[vis.category]);
            //return vis.height - vis.y(d.savings_USD_sum);
        })
        .style("fill", function(d) {
            return vis.colorScale(d.num_years);
        })
        .on("mouseover", function(d, index) {
            d3.select(this)
                .style("fill", "brown");
            vis.tip.show(d);
        })
        .on('mouseout', function(d, index) {
            d3.select(this)
                .style("fill", function(d) {
                    return vis.colorScale(d.num_years);
                });
            vis.tip.hide(d)})
        .attr("data-legend",function(d) {
            return  d.num_years + " yr total";
        });

    bars
        .transition()
        .duration(800)
        .style("fill", function(d) {
            return vis.colorScale(d.num_years);
        })
        .attr("x", function (d) {
            //return vis.x(d.key);
	    return (vis.category == 'savings_USD_sum' || vis.category == 'totalCostUSD') ? vis.x(d.key) + 0.0*vis.x.rangeBand() : vis.x(d.key) })
        .attr("y", function (d) {
            return (vis.category == 'totalCostUSD') ? vis.y(d['savings_USD_sum']): vis.y(d[vis.category]);		    
        })
        .attr("width", function(d){ return (vis.category == 'savings_USD_sum' || vis.category == 'totalCostUSD') ? 0.5*vis.x.rangeBand() : vis.x.rangeBand(); })    
	.attr("height", function (d) {
            return (vis.category == 'totalCostUSD') ? vis.height - vis.y(d['savings_USD_sum']): vis.height - vis.y(d[vis.category]);	
            //return vis.height - vis.y(d[vis.category]);
        })
        .attr("data-legend",function(d) {
            return  d.num_years + " yr total";
        })

    bars.exit().remove();

    var tbars = vis.svg.selectAll(".tbar")
        .data(vis.displayData);

    tbars.enter()
    	.append("rect")
    	//.each(function(d, i){for(var j=0; j<d.num_years; j++){ console.log(i, j, d.num_years)}})
        .attr("class", "tbar")
        .attr("x", function (d) {
            //return vis.x(d.key);
	    return (vis.category == 'savings_USD_sum' || vis.category == 'totalCostUSD') ? vis.x(d.key) + 0.5*vis.x.rangeBand() : vis.x(d.key) })
        .attr("y", function (d) {
            return vis.y(d.totalCostUSD) < 0 ? 0 : vis.y(d.totalCostUSD);
        })
        .attr("width", function(d){ return (vis.category == 'savings_USD_sum' || vis.category == 'totalCostUSD') ? 0.5*vis.x.rangeBand() : 0 })
        .attr("height", function (d) {
            return vis.height - vis.y(d.totalCostUSD) > vis.height ? vis.height : vis.height - vis.y(d.totalCostUSD);
        })
        .style("fill", function(d) {
            return vis.tcolorScale(d.num_years);
        })
	.style("opacity", 0.5)
        .on("mouseover", function(d, index) {
            d3.select(this)
                .style("fill", "brown");
            vis.tbartip.show(d);
        })
        .on('mouseout', function(d, index) {
            d3.select(this)
                .style("fill", function(d) {
                    return vis.tcolorScale(d.num_years);
                });
            vis.tbartip.hide(d)});

    tbars
        .transition()
        .duration(800)
        .style("fill", function(d) {
            return vis.tcolorScale(d.num_years);
        })
	.style("opacity", 0.5)    
        .attr("x", function (d) {
            //return vis.x(d.key);
	    return (vis.category == 'savings_USD_sum' || vis.category == 'totalCostUSD') ? vis.x(d.key) + 0.5*vis.x.rangeBand() : vis.x(d.key) })
        .attr("y", function (d) {
            return vis.y(d.totalCostUSD) < 0 ? 0 : vis.y(d.totalCostUSD);
        })
        .attr("width", function(d){ return (vis.category == 'savings_USD_sum' || vis.category == 'totalCostUSD') ? 0.5*vis.x.rangeBand() : 0 })
        .attr("height", function (d) {
            return vis.height - vis.y(d.totalCostUSD) > vis.height ? vis.height : vis.height - vis.y(d.totalCostUSD);
        })
    

    tbars.exit().remove();
    
    vis.svg.select(".y.axis.group")
	.transition()
	.duration(800)
	.call(vis.yAxis);

    vis.svg.select(".x.axis.group")
	.transition()
	.duration(800)
	.call(vis.xAxis)
	.selectAll("text")
	.attr("y", 4)
	.attr("x", 8)    
        .attr("transform", "rotate(45)")
	.style("text-anchor", "start");

    //attribute data-legend-pos
    vis.legend = vis.svg.append("g")
        .attr("class","legend")
        .attr("transform","translate(500,10)")
        .style("font-size","12px")
        .call(d3.legend);

    vis.svg.select(".y.axis-title")
	.text(cat_label[vis.category]);
    
    
    
}
