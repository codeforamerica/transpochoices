TranspoChoices is all about making better transportation choices. However, our
calculations are only approximations and should be treated as such.

## Assumptions

### Walking

**Cost** - Always rounding to $0

**Time** - Calculated by [Bing Walking Routes API][7]

   [7]: http://msdn.microsoft.com/en-us/library/ff701717.aspx

**Calories** - Using this [table][8], assuming a 190lb individual

   [8]: http://transportation.stanford.edu/pdf/caloriecalc_walk.pdf

**CO2 Emissions** - Always rounding to 0

### Biking

**Cost** - [$0.115 per mile][9]

   [9]: http://www.kenkifer.com/bikepages/advocacy/autocost.htm

**Time** - Calculated by [Bing Walking Routes API][10], then extrapolates biking time

   [10]: http://msdn.microsoft.com/en-us/library/ff701717.aspx

**Calories** - Assuming 30km/h and 24 calories/km

**CO2 Emissions** - Always rounding to 0

### Transit

**Cost** - Uses fare data in the [GTFS specification][11] (SF Muni and BART only)

   [11]: http://code.google.com/transit/spec/transit_feed_specification.html

**Time** - Calculated by [Bing Transit Routes API][12]

   [12]: http://msdn.microsoft.com/en-us/library/ff701717.aspx

**Calories** - Calories burned while walking to transit, then 1.4-1.7 calories per idle minute

**CO2 Emissions** - 0, but only because can can't find a good way to calculate it

### Taxi

**Cost** - Uses [TaxiFareFinder.com][13]

   [13]: http://www.taxifarefinder.com/rates.php

**Time** - Calculated by [Bing Driving Routes API][14]

   [14]: http://msdn.microsoft.com/en-us/library/ff701717.aspx

**Calories** - 1.4-1.7 calories per idle minute

**CO2 Emissions** - [8.788 kg CO2/gallon gasoline at 35.4 km/gallon][15]

   [15]: http://www.epa.gov/otaq/climate/420f05004.htm#step1

### Driving

**Cost** - Uses $0.585, the [2011 AAA average cost per mile][16]

   [16]: http://www.aaaexchange.com/Assets/Files/201145734460.DrivingCosts2011.pdf

**Time** - Calculated by [Bing Driving Routes API][17]

   [17]: http://msdn.microsoft.com/en-us/library/ff701717.aspx

**Calories** - 1.4-1.7 calories per idle minute

**CO2 Emissions** - [8.788 kg CO2/gallon gasoline at 35.4 km/gallon][18]

   [18]: http://www.epa.gov/otaq/climate/420f05004.htm#step1

## Who Made This?

TranspoChoices was lovingly made by [Code for America][19] fellows [Aaron
Ogle][20] and [Talin Salway][21], with design work by [Pete Fecteau][22]. Feel
free to send feedback to aaron [at] codeforamerica.org.

   [19]: http://codeforamerica.org
   [20]: http://twitter.com/atogle
   [21]: http://twitter.com/yenthefirst
   [22]: http://twitter.com/peterfecteau

## This is cool. Can I help?

Sure! TranspoChoices is an [open-source project][23] and we're looking for
people with all kinds of talent to [get involved][24].

   [23]: https://github.com/codeforamerica/transpochoices
   [24]: http://codeforamerica.org/?cfa_project=transportation-choices

## API
	/info_for_route_bing?origin=<>&destination=<>

Example:

	info_for_route_bing?destination=88%202nd%20%20st,%20san%20francisco&origin=563%2046th%20st%20oakland

Returns:
	
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

## Deploying:
	some features depend on ruby 1.9.2. to deploy on heroku, use the following when creating:
	heroku create --stack bamboo-mri-1.9.2 <appname>
	or the following, to fix an existing app:
	heroku stack:migrate bamboo-mri-1.9.2 <appname>

[![Code for America Tracker](http://stats.codeforamerica.org/codeforamerica/transpochoices.png)](http://stats.codeforamerica.org)