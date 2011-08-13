TranspoChoices is all about making better transportation choices. However, our
calculations are only approximations and should be treated as such.

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

## Deploying
	some features depend on ruby 1.9.2. to deploy on heroku, use the following when creating:
	heroku create --stack bamboo-mri-1.9.2 <appname>
	or the following, to fix an existing app:
	heroku stack:migrate bamboo-mri-1.9.2 <appname>

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

**CO2 Emissions** - [0.65 pounds of CO2 per passenger mile][13] - assuming bus transit

   [13]: http://www.fta.dot.gov/documents/PublicTransportationsRoleInRespondingToClimateChange.pdf

### Taxi

**Cost** - Uses [TaxiFareFinder.com][14]

   [14]: http://www.taxifarefinder.com/rates.php

**Time** - Calculated by [Bing Driving Routes API][15]

   [15]: http://msdn.microsoft.com/en-us/library/ff701717.aspx

**Calories** - 1.4-1.7 calories per idle minute

**CO2 Emissions** - [0.96 pounds of CO2 per passenger mile][16] - assuming single occupancy vehicle

   [16]: http://www.fta.dot.gov/documents/PublicTransportationsRoleInRespondingToClimateChange.pdf

### Driving

**Cost** - Uses $0.585, the [2011 AAA average cost per mile][17]

   [17]: http://www.aaaexchange.com/Assets/Files/201145734460.DrivingCosts2011.pdf

**Time** - Calculated by [Bing Driving Routes API][18]

   [18]: http://msdn.microsoft.com/en-us/library/ff701717.aspx

**Calories** - 1.4-1.7 calories per idle minute

**CO2 Emissions** - [0.96 pounds of CO2 per passenger mile][19] - assuming single occupancy vehicle

   [19]: http://www.fta.dot.gov/documents/PublicTransportationsRoleInRespondingToClimateChange.pdf

## Who Made This?

TranspoChoices was lovingly made by [Code for America][20] fellows [Aaron
Ogle][21] and [Talin Salway][22], with design work by [Pete Fecteau][23]. Feel
free to send feedback to aaron [at] codeforamerica.org.

   [20]: http://codeforamerica.org
   [21]: http://twitter.com/atogle
   [22]: http://twitter.com/yenthefirst
   [23]: http://twitter.com/peterfecteau

## This is cool. Can I help?

Sure! TranspoChoices is an [open-source project][23] and we're looking for
people with all kinds of talent to [get involved][24].

   [24]: https://github.com/codeforamerica/transpochoices
   [25]: http://codeforamerica.org/?cfa_project=transportation-choices

[![Code for America Tracker](http://stats.codeforamerica.org/codeforamerica/transpochoices.png)](http://stats.codeforamerica.org)