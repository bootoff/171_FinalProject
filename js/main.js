// GLOBAL VARS ETC. ----------------------------------------------

// global variables for primary datasets
var citiesMA = [], // geoJSON - cities in MA
    citiesMATest,
    dataByFacility = [], // array[19] of facilities and respective data
    facilityLocations = [], // lat, long for pilot program facilities
    plants = [], // primary data set - pilot program results
    SummaryData = [], //
    projects = [], //
    projects_nested = [];
    //ghg = {},
    //ghg_tmp = {},
    AnnualData = [];

// Set ordinal color scale
var colorScale = d3.scale.category20();

// global variables - miscellaneous
var centerOfMA = [42.358734, -71.849239], // Holden, MA -- for centering facilityMap
    ghg = {}, // GHG conversion rates for each FY
    //GHGsum = 0.0,
    defaultUSDperKWh = 0.20,
    metricTonsPerLb = 0.000453592;

// global variables for visualization instances
var facilityMap,
    co2Savings,
    squaresChart,
    usageCostScatter,
    timeLine;

// specify path to Leaflet images: in [dir]/img
L.Icon.Default.imagePath = 'img/';





// INSTANTIATE VISUALIZATIONS ------------------------------------------------------------

// create visualizations
function createVis() {

    // squaresChart event handler
    var myEventHandler = {};

    // timeLine event handler
    var timeLineEventHandler = {};
    
    facilityMap = new FacilityMap("facility-map", facilityLocations, citiesMATest, centerOfMA);
    co2Savings = new Co2Savings("comparison-stacked", SummaryData);
    usageCostScatter = new UsageCostScatter("usagecost-scatter", plants, dataByFacility);
    squaresChart = new SquaresChart("squares-chart", plants, myEventHandler);
    timeLine = new TimeLine("timeline", plants, dataByFacility, timeLineEventHandler);
    //stackedArea = new StackedAreaChart("stackedarea", dataByFacility, myEventHandler);

    $(myEventHandler).bind("selectionChanged", function(event, category){
	    //console.log("handler: ", category);
	    squaresChart.onSelectionChange(event, category);
    });

    $(timeLineEventHandler).bind("timeLineSelectChange", function(event, category) {
        timeLine.onSelectionChange(event, category);
    });
}




// WORK WITH DATA ------------------------------------------------

// load data asynchronously
queue()
    .defer(d3.csv, "data/towns_served.csv")
    .defer(d3.json, "data/mass_cities.json")
    .defer(d3.json, "data/TownsMA_EPSG_01.json")
    .defer(d3.csv, "data/plants.csv")
    .defer(d3.csv, "data/ghg.csv")
    .defer(d3.csv, "data/project_details.csv")
    .await(wrangleData);

// clean up data
function wrangleData(error, townsServed, massCities, cityTest, plantsData, GHGdata, projectData) {
    if (!error) {
        // store loaded data
        citiesMA = massCities,
            citiesMATest = cityTest,
            facilityLocations = townsServed,
            plants = plantsData,
	        projects = projectData;

        // Make the ghg factor dictionary.
        GHGdata.forEach(function (d) {
            ghg[d.FY] = +d["GHG factor"];
        });

        // wrangle "plants" dataset
        wranglePlants();

        // wrangle "dataByFacility" dataset
        wrangleDataByFacility();

        // wrangle "projects" dataset
        wrangleProjectData();
	
        // wrangle data for facilityMap.js
        wrangleFacilityMap();

        // wrangle "SummaryData" dataset
        wrangleSummaryData();

        // create visualizations
        createVis();

    }
}

// wrangle "plants" dataset
function wranglePlants() {
    plants.forEach(function (d) {
        d.ElectricityGenerationKWh = +d.ElectricityGenerationKWh;
        d.GHGlbs = +d.GHGlbs;

	// Note that the GHG emissions can be computed from the UsageKWh
	// primary data, rather than using the values in the excel sheets.
	// They are not independent.

        d.GHG = d.GHGlbs;
        d.USDperKWh = +d.USDperKWh;
        d.UsageKWh = +d.UsageKWh;
        d.UsageUSD = +d.UsageUSD;
    });

    // We decided to drop the Chelmsford data.
    plants = plants.filter(function(d) { return d.Facility != "Chelmsford Water District" });


    // SavingsUSD and SavingsKWh are derived from the Usage data, and there
    // seem to be errors.  I suggest that we drop the versions in the CSV and
    // just generate new versions, as needed.
    //
    plants.forEach(function(d) {
        delete d.SavingsUSD;
        delete d.SavingsKWh;
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

	d.savingsUSD = d.ElectricityGenerationKWh * d.Rate;
    });
}

// create "dataByFacility" dataset
function wrangleDataByFacility() {
    // get unique names of facilities
    var uniqueFacilities = d3.map(plants, function(d) {
        return d.Facility;
    }).keys();

    // put unique facilities into array of objects
    dataByFacility = uniqueFacilities.map(function(d) {
        return {
            "id": d,
            "values": []
        };
    });

    // populate each facility object with data by FY
    dataByFacility.forEach(function(d) {
        d.values = plants.filter(function(d2) {
            if (d.id == d2.Facility)
                return d2;
        });
    });
}

// wrangle "SummaryData" dataset
function wrangleSummaryData() {
    //console.log(plants);
    var nested = d3.nest()
        .key(function (d) {
            return d.Facility;
        })
        .entries(plants);

    //console.log(nested);

    nested.forEach(function (d, index) {
        SummaryData[index] = {};
        SummaryData[index].key = d.key;
        SummaryData[index].savings_USD_sum = 0.0;
        SummaryData[index].ghg_sum = 0.0;
        SummaryData[index].num_years = 0;
        SummaryData[index].energy_sum = 0.0;
        SummaryData[index].usage_sum = 0.0;

        d.values.forEach(function (data, i2) {
            if (data.ElectricityGenerationKWh != "" && (+data.FY) >= 10) {
                SummaryData[index].ghg_sum += data.GHG * metricTonsPerLb;
                SummaryData[index].energy_sum += (+data.ElectricityGenerationKWh);
                SummaryData[index].usage_sum += (+data.UsageKWh);
                SummaryData[index].savings_USD_sum += (+data.ElectricityGenerationKWh) * (+data.Rate);
                SummaryData[index].num_years += 1;
            }
        });
    });

    var SavingsKWh = 0;
    var SavingsUSD = 0;
    var SavingsGHG = 0;

    SummaryData.forEach(function (data, index) {
        SavingsKWh += data.energy_sum;
        SavingsUSD += data.savings_USD_sum;
        SavingsGHG += data.ghg_sum;
    });
    //console.log("Savings (Millions of KWH): ", SavingsKWh / 1e6, "Savings (Millions USD): ", SavingsUSD / 1e6, "Savings (Tons): ", SavingsGHG);

    //console.log(projects_nested);

    SummaryData.forEach(function(data, index){
	for(var i=0; i<projects_nested.length; i++){
	    if(data.key == projects_nested[i].key){	    
		for(var x in projects_nested[i].values){
		    SummaryData[index][x] = projects_nested[i].values[x];
		}
	    }
	}
    });

    //console.log(SummaryData);
    
    var nestedFY = d3.nest()
        .key(function (d) {
            return d.FY;
        })
        .entries(plants);

    //console.log(nestedFY);

    nestedFY.forEach(function (d, index) {

        AnnualData[index] = {};
        AnnualData[index].key = d.key;
        AnnualData[index].savings_USD_sum = 0.0;
        AnnualData[index].ghg_sum = 0.0;
        AnnualData[index].num_facilities = 0;
        AnnualData[index].energy_sum = 0.0;
        AnnualData[index].usage_sum = 0.0;

        d.values.forEach(function (data, i2) {
            //console.log(data);

            if (data.ElectricityGenerationKWh != "" && (+data.FY) >= 10) {
                AnnualData[index].ghg_sum += data.GHG * metricTonsPerLb;
                AnnualData[index].energy_sum += (+data.ElectricityGenerationKWh);
                AnnualData[index].usage_sum += (+data.UsageKWh);
                AnnualData[index].savings_USD_sum += (+data.ElectricityGenerationKWh) * (+data.Rate);
                AnnualData[index].num_facilities += 1;
            }
        });
    });
}

// wrangle data for facilityMap.js
function wrangleFacilityMap() {
    facilityLocations.forEach(function (d) {
        d.latitude = +d.latitude;
        d.longitude = +d.longitude;
        d.townsServed = d.townsServed.split(',');
    });
}

// create "projects" dataset
function wrangleProjectData() {

    // We decided to drop the Chelmsford data.
    projects = projects.filter(function(d) { return d.Facility != "Chelmsford Water District" });
    // Drop some outdated or unreliable data
    projects.forEach(function(d){delete d["Energy Generated (KWh)"]});
    projects.forEach(function(d){delete d["Savings – REC revenue ($)"]});
    projects.forEach(function(d){delete d["Savings – avoided electricity ($)"]});
    projects.forEach(function(d){delete d["Installed Cost ($) per watt"]});
    projects.forEach(function(d){delete d["Energy per unit power (kWh/kW)"]});

    
    projects_nested = d3.nest()
        .key(function (d) {
            return d.Facility;
        })
	.sortKeys(d3.ascending)
	.rollup(function(leaves) { return {"numInstallations": leaves.length,
					   "totalCostUSD": d3.sum(leaves, function(d) {return +d["Installed Cost ($)"]}),
					   "totalPowerKWh": d3.sum(leaves, function(d) {return +d["Installation size (KW)"]})}})
        .entries(projects);

}
