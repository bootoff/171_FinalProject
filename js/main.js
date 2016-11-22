// GLOBAL VARS ETC. ----------------------------------------------

// global variables for waterMap
var facilityLocations = [],
    citiesMA = [],
    plants = [],
    ghg = {};

// Holden, MA (~center of Massachusetts) -- for center
var centerOfMA = [42.358734, -71.849239];

// global variables for visualization instances
var facilityMap;

// specify path to Leaflet images: in [dir]/img
L.Icon.Default.imagePath = 'img/';


// WORK WITH DATA ------------------------------------------------

// load data asynchronously
queue()
    .defer(d3.csv, "data/regions_served.csv")
    .defer(d3.json, "data/mass_cities.json")
    .defer(d3.csv, "data/plants.csv")
    .defer(d3.csv, "data/ghg.csv")
    .await(createVis);

var cnt = 0;
// clean up data and create visualizations
function createVis(error, regionsServed, massCities, plantsData, GHGdata) {

    facilityLocations = regionsServed;
    citiesMA = massCities;
    plants = plantsData;

    GHGdata.forEach(function(d){
	ghg[d.FY] = d["GHG factor"];
    });

    // We decided to drop the Chelmsford data.
    plants = plants.filter(function(d){ return d.Facility!="Chelmsford Water District" });

    // SavingsUSD and SavingsKWh are derived from the Usage data, and there
    // seem to be errors.  I suggest that we drop the versions in the CSV and
    // just generate new versions, as needed.
    //
    plants.forEach(function(d) {
	delete d.SavingsUSD;
	delete d.SavingsKWh;
    });

    // Computing GHG emissions
    plants.forEach(function(d) {
	if(d.ElectricityGenerationKWh != ""){
	    d.GHG = (+d.ElectricityGenerationKWh)*ghg[d.FY];
	}else{
	    d.GHG = "";
	}
    });
    
    // Trying to regularized the cost rates
    plants.forEach(function(d) {

	// There are a few missing UsageUSD values;
	if(d.UsageUSD == "" && d.UsageKWh != "" && d.USDperKWh != ""){
	    d.UsageUSD = (+d.UsageKWh) * (+d.USDperKWh);	    
	}
	
	if(d.USDperKWh != ""){
	    d.Rate = (+d.USDperKWh);
	}else if(d.UsageUSD != "" && d.UsageKWh != ""){
	    d.Rate = (+d.UsageUSD)/(+d.UsageKWh);
	}else {
	    cnt++;
	    d.Rate = (+d.UsageUSD)/(+d.UsageKWh);
	    console.log(cnt, "RATE! ", "USDperKWh: ", d.USDperKWh, ", calcuated Rate: ", d.Rate.toFixed(4), d);
	}
    });

    console.log(plants);
    var nested = d3.nest()
	.key(function(d) { return d.Facility;})
    	.key(function(d) { return d.Type;})
	.entries(plants);

    var metricTonsPerLb = 0.000453592;
    nested.forEach(function(d){
	d.values.forEach(function(data, index){
	    var GHGsum = 0.0;
	    data.values.forEach(function(d2, i2){
		if((+d2.FY)>=13){
		    //console.log(data, d2.FY, d2.GHGlbs, d2.GHG);		    
		    GHGsum += d2.GHG*metricTonsPerLb;
		}
	    });
	    console.log(d.key, "GHGsum: ", GHGsum);
	});
    });

    plants.forEach(function(d, index){
	if(d.ElectricityGenerationKWh != ""){
	    console.log("plant: ", d.Facility, d.FY, d.UsageKWh, d.ElectricityGenerationKWh);
	}
    });
    // waterMap.js clean up data
    facilityLocations.forEach(function(d) {
        d.Latitude = +d.Latitude;
        d.Longitude = +d.Longitude;
        d["Towns served"] = d["Towns served"].split(',');
    });

    // instantiate visualizations
    facilityMap = new FacilityMap("water-map", facilityLocations, citiesMA, centerOfMA);
}
