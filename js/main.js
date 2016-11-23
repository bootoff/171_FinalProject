// GLOBAL VARS ETC. ----------------------------------------------

// global variables for data
var facilityLocations = [],
    citiesMA = [],
    plants = [],
    ghg = {},
    GHGsum = {},
    defaultUSDperKWh = 0.20,
    metricTonsPerLb = 0.000453592;

// Holden, MA (~center of Massachusetts) -- for center
var centerOfMA = [42.358734, -71.849239];

// global variables for visualization instances
var facilityMap,
    co2Savings,
    usageCostScatter;


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

// clean up data and create visualizations
function createVis(error, regionsServed, massCities, plantsData, GHGdata) {

    facilityLocations = regionsServed;
    citiesMA = massCities;
    plants = plantsData;

    // Making the ghg factor dictionary.
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

    // Computing GHG emissions from primary data, rather than using
    // the values in the excel sheets.
    plants.forEach(function(d) {
	if(d.ElectricityGenerationKWh != ""){
	    d.GHG = (+d.ElectricityGenerationKWh)*ghg[d.FY];
	}else{
	    d.GHG = "";
	}
    });
    
    // Regularizing the cost rates
    plants.forEach(function(d) {

	// There are a few missing UsageUSD values;
	// fill them in where possible.
	if(d.UsageUSD == "" && d.UsageKWh != "" && d.USDperKWh != ""){
	    d.UsageUSD = (+d.UsageKWh) * (+d.USDperKWh);	    
	}

	if(d.USDperKWh != ""){
	    // If there as a rate in the csv file, use it.
	    d.Rate = (+d.USDperKWh);
	}else if(d.UsageUSD != "" && d.UsageKWh != ""){
	    // If the rate is missing in the csv file but we
	    // have the usage in USD and KWh, compute the rate
	    d.Rate = (+d.UsageUSD)/(+d.UsageKWh);
	}else {
	    // Otherwise, just assume a defaultUSDperKWh;
	    d.Rate = defaultUSDperKWh;
	}
    });

    console.log(plants);
    var nested = d3.nest()
	.key(function(d) { return d.Facility;})
    	.key(function(d) { return d.Type;})
	.entries(plants);

    nested.forEach(function(d){
	d.values.forEach(function(data, index){
	    GHGsum[d.key] = 0.0;
	    data.values.forEach(function(d2, i2){
		if((+d2.FY)>=13){
		    GHGsum[d.key] += d2.GHG*metricTonsPerLb;
		}
	    });
	    console.log(d.key, "GHGsum: ", GHGsum[d.key]);
	});
    });

    for(key in GHGsum){
	console.log(key, GHGsum[key]);
    }

    nested.forEach(function(data1){
	data1.values.forEach(function(data2, index){
	    data2.values.forEach(function(data3, i2){
		if(data3.ElectricityGenerationKWh != "" && (+data3.FY)>=10){
		    console.log(data3.Facility, data3.Type, data3.FY, data3.UsageKWh, data3.ElectricityGenerationKWh, data3.ElectricityGenerationKWh/data3.UsageKWh);
		}
	    });
	});
    });
    
    plants.forEach(function(d, index){
	if(d.ElectricityGenerationKWh != ""){
	    console.log("plant: ", d.Facility, d.FY, d.UsageKWh, d.ElectricityGenerationKWh);
	}
    });

    // clean up data for waterMap.js
    facilityLocations.forEach(function(d) {
        d.Latitude = +d.Latitude;
        d.Longitude = +d.Longitude;
        d["Towns served"] = d["Towns served"].split(',');
    });

    // instantiate visualizations
    facilityMap = new FacilityMap("water-map", facilityLocations, citiesMA, centerOfMA);
	co2Savings = new co2Savings("co2-Savings", GHGsum);
    usageCostScatter = new UsageCostScatter("usagecost-scatter", plants);
}
