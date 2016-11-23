// GLOBAL VARS ETC. ----------------------------------------------

// global variables for data
var facilityLocations = [],
    citiesMA = [],
    plants = [],
    ghg = {},
    SummaryData = [],
    AnnualData = [],
    NumYears = {},
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
	.entries(plants);

    console.log(nested);
        
    nested.forEach(function(d, index){

	SummaryData[index] = {};
	SummaryData[index].key = d.key;
	SummaryData[index].savings_USD_sum = 0.0;	
	SummaryData[index].ghg_sum = 0.0;
	SummaryData[index].num_years = 0;	
	SummaryData[index].energy_sum = 0.0;
	SummaryData[index].usage_sum = 0.0;

    	d.values.forEach(function(data, i2){

	    if(data.ElectricityGenerationKWh != "" && (+data.FY)>=10){

		SummaryData[index].ghg_sum += data.GHG*metricTonsPerLb;
		SummaryData[index].energy_sum += (+data.ElectricityGenerationKWh);
		SummaryData[index].usage_sum  += (+data.UsageKWh);
		SummaryData[index].savings_USD_sum += (+data.ElectricityGenerationKWh)*(+data.Rate);
		SummaryData[index].num_years  += 1;
		
	    }

	});

    });

    var SavingsKWh = 0;
    var SavingsUSD = 0;
    var SavingsGHG = 0;
    
    SummaryData.forEach(function(data, index){
	SavingsKWh += data.energy_sum;
	SavingsUSD += data.savings_USD_sum;
	SavingsGHG += data.ghg_sum;		
    });
    console.log("Savings (Millions of KWH): ", SavingsKWh/1e6, "Savings (Millions USD): ", SavingsUSD/1e6, "Savings (Tons): ", SavingsGHG);

    var nestedFY = d3.nest()
	.key(function(d) { return d.FY;})
	.entries(plants);

    console.log(nestedFY);    

    nestedFY.forEach(function(d, index){

	AnnualData[index] = {};
	AnnualData[index].key = d.key;
	AnnualData[index].savings_USD_sum = 0.0;	
	AnnualData[index].ghg_sum = 0.0;
	AnnualData[index].num_facilities = 0;	
	AnnualData[index].energy_sum = 0.0;
	AnnualData[index].usage_sum = 0.0;
	
    	d.values.forEach(function(data, i2){

	    console.log(data);
	    
	    if(data.ElectricityGenerationKWh != "" && (+data.FY)>=10){

		AnnualData[index].ghg_sum += data.GHG*metricTonsPerLb;
		AnnualData[index].energy_sum += (+data.ElectricityGenerationKWh);
		AnnualData[index].usage_sum  += (+data.UsageKWh);
		AnnualData[index].savings_USD_sum += (+data.ElectricityGenerationKWh)*(+data.Rate);
		AnnualData[index].num_facilities  += 1;
		
	    }
	});
    });

    
    // clean up data for waterMap.js
    facilityLocations.forEach(function(d) {
        d.Latitude = +d.Latitude;
        d.Longitude = +d.Longitude;
        d["Towns served"] = d["Towns served"].split(',');
    });

    console.log(AnnualData);    
    console.log(SummaryData);
    
    // instantiate visualizations
    facilityMap = new FacilityMap("water-map", facilityLocations, citiesMA, centerOfMA);
	co2Savings = new Co2Savings("co2-Savings", GHGsum);
    usageCostScatter = new UsageCostScatter("usagecost-scatter", plants);
}
