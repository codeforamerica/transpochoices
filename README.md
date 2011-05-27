TranspoChoices

	For comparing the calories of subway sanwiches

API
	/info_for_route_bing?origin=<>&destination=<>
		returns a JSON markup thing.
	example:
	info_for_route_bing?destination=88%202nd%20%20st,%20san%20francisco&origin=563%2046th%20st%20oakland
	returns:
	
	{
		"units": {
			"distance": "kilometers",
			"duration": "seconds",
			"emissions": "milliliters of innocent bunny blood",
			"cost": "usd",
			"calories": "calories"
		},
		"results": {
			"driving": {
				"distance": 15.943,
				"duration": 900
			},
			"walking": null,
			"transit": {
				"duration": 2427,
				"while_walking": {
					"distance": 1.872,
					"duration": 1347
				},
				"while_transit": {
					"duration": 1080
				}
			}
		}
	}
	
Algorithms & Assumptions
	Automobile: for now, we'll just track CO2 emissions. other emissions to estmate include N2O, CH4, and HFCs.
	going by http://www.epa.gov/otaq/climate/420f05004.htm#step1, we'll use a value of 8.788 kg CO2 / gallon gasoline
	
	for now, we're assuming a 2010 Toyota Camry, with 22 Miles per Gallon (http://www.fueleconomy.gov/feg/findacar.htm)
	this converts to 35.406 km/gallon
	
	Gas prices flucuate constantly, and vary widely between regions. for the moment, we'll use 4.147$ / gallon (the average of ($4.040 for the east coast, and $4.254 for california, to cover philidelphia and california)
	http://www.eia.doe.gov/oil_gas/petroleum/data_publications/wrgp/mogas_home_page.html
	
	instead of using gas price directly, we'll use AAA's average cost per mile, assuming a medium sedan, 15k miles per year, is $0.573/mile, which is $0.356/km
	http://www.aaaexchange.com/Assets/Files/201145734460.DrivingCosts2011.pdfl
	
	still trying to find a good source, but it looks like you can assume between 1.4~1.7 calories per minute while sitting. I'll use 1.7, assuming a heavy person.
	
	Biking time: we assume that the average biking speed is about 30 km/hr (18 m/hr)
	
	Calories Burned walking: we're using this table: http://transportation.stanford.edu/pdf/caloriecalc_walk.pdf
	For now, we're assuming a 190 lb. person.
	
	biking: 
	http://morechristlike.com/calories-burned-cycling/
	at 30km/h, about 24 calories/km
	
	Emissions while walking or biking: technically more than 0 - you have to account for the production of shoes or bikes, and CO2 exhaled during activity. I can't find a number, and it's pretty close to 0. I'm calling it 0 for now.
	
	costs of biking: http://www.kenkifer.com/bikepages/advocacy/autocost.htm
	roughly $0.115 / mile ($0.07146 / km)
	no exact number established
	
	taxi:
	the same emissions, calories, and time as a car, but rates calculated per http://www.taxifarefinder.com/rates.php
Setting Up:
	You need to set the environment variable BING_KEY to your Bing API key

Deploying:
	some features depend on ruby 1.9.2. to deploy on heroku, use the following when creating:
	heroku create --stack bamboo-mri-1.9.2 <appname>
	or the following, to fix an existing app:
	heroku stack:migrate bamboo-mri-1.9.2 <appname>

[![Code for America Tracker](http://stats.codeforamerica.org/codeforamerica/transpochoices.png)](http://stats.codeforamerica.org)