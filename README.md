ReRoute.it
=======

TranspoChoices is all about making better transportation choices. However, our
calculations are only approximations and should be treated as such.

Installation
------------
    # Install the app
    $ git@github.com:codeforamerica/transpochoices.git
    $ cd transpochoices
    $ bundle install
    $ bundle exec rackup

Open your web browser to http://localhost:9292/

## <a name="ci">Continuous Integration</a>
[![Build Status](https://secure.travis-ci.org/codeforamerica/transpochoices.png)](http://travis-ci.org/codeforamerica/transpochoices)

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

**Calories** - Using this [table][8], assuming a 160lb individual

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

**Cost** - Uses scraped taxi rates

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

Contributing
------------
In the spirit of [free software](http://www.fsf.org/licensing/essays/free-sw.html), **everyone** is encouraged to help improve this project.

Here are some ways *you* can contribute:

* by using alpha, beta, and prerelease versions
* by reporting bugs
* by suggesting new features
* by writing or editing documentation
* by writing specifications
* by writing code (**no patch is too small**: fix typos, add comments, clean up inconsistent whitespace)
* by refactoring code
* by resolving [issues](http://github.com/codeforamerica/transpochoices/issues)
* by reviewing patches

Submitting an Issue
-------------------
We use the [GitHub issue tracker](http://github.com/codeforamerica/transpochoices/issues) to track bugs and
features. Before submitting a bug report or feature request, check to make sure it hasn't already
been submitted. You can indicate support for an existing issuse by voting it up. When submitting a
bug report, please include a [Gist](http://gist.github.com/) that includes a stack trace and any
details that may be necessary to reproduce the bug, including your gem version, Ruby version, and
operating system. Ideally, a bug report should include a pull request with failing specs.

Submitting a Pull Request
-------------------------
1. Fork the project.
2. Create a topic branch.
3. Implement your feature or bug fix.
4. Add documentation for your feature or bug fix.
5. Run <tt>bundle exec rake doc:yard</tt>. If your changes are not 100% documented, go back to step 4.
6. Add specs for your feature or bug fix.
7. Run <tt>bundle exec rake spec</tt>. If your changes are not 100% covered, go back to step 6.
8. Commit and push your changes.
9. Submit a pull request. Please do not include changes to the gemspec, version, or history file. (If you want to create your own version for some reason, please do so in a separate commit.)

Supported Rubies
----------------
This library aims to support and is [tested
against](http://travis-ci.org/codeforamerica/transpochoices) the following Ruby
implementations:

* Ruby 1.9.2
* Ruby 1.9.3

Copyright
---------
Copyright (c) 2011 Code for America Laboratories
See [LICENSE](https://github.com/codeforamerica/transpochoices/blob/master/LICENSE.mkd) for details.


[![Code for America Tracker](http://stats.codeforamerica.org/codeforamerica/transpochoices.png)](http://stats.codeforamerica.org)

                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~
                                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             ~~~~~~~~MM:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             ~~~~~~~~M MN~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ~~~~~~~~~:M . MM?~~~:~~~~~:~~~~:~~~~:~IMMMMM$~~~:~~~~~~~~~~:~~~~~~~~~~~~~~~~~~~~~~~~~
          ~~~~~~~~~~~M   . IMMMN+:~~~~~$DMMMMMMMMI...  ,NMMMMMMMNZ=~~~I8MMMMM8~~~~~~~~~~~~~~~~~~~
         ~~~~~~~~~~~~MMMMMMMMMMMMMMMMMMM..   ... .      ..  ..  . .    .   MMMMM7~~~~~~~~~~~~~~~~~
        ~~~~~~~~~~~~~MMMMMMMMMMMMMMMMM:                                     ,MMMM?~~~~~~~~~~~~~~~~
        ~~~~~~~~~~~~~MMMMMMMMMMMMMMM...                                     ..NMMZ~~~~~~~~~~~~~~~~~
       ~~~~~~~~::~~~$MMMMMMMMMMMMMN.                                        .  MM~~~~~~~~~~~~~~~~~~~
       ~~~~~~~~:~MMI.OMMMMMMMMMMM...                                           OM~~~~~~~~~~~~~~~~~~~
      ~~~~~~~~=MM  .  MMMMMMMMMN                              .. ..        M.  7M~~~~~~~~~~~~~~~~~~~~
     ~~~~~~~MM,   MMMMMMMMMMMM...                             .+++.      .M . .M~~~~~~~~~~~~~~~~~~~~~
     ~~~~=MN. .$MMMMMMMMMMMMZ                ... ....7MMMMMNMMMMMMMMMMMN......ZM~~~~~~~~~~~~~~~~~~~~~~
     ~~DM~...MMMMMMMMMMMMM~.            ...   IMMMMMMMMMMMM. MMMMMMMMMMMMM ..MN~~~~~~~~~~~~~~~~~~~~~~~
    77MI  +MMMMMMMMMMMMMD.           . .. MMMMMMMMMMMMMMMM  ..MMMMMMMMMMMMM7M~~~~~~~~~~~~~~~~~~~~~~~~~
    M: .8MMMMMMMMMMMMM,        .     ?MMMMMMMMMMMMMMMMMMMM    MMMMMMM?IMMMM?:~~~~~~~~~~~~~~~~~~~~~~~~~~
     .,MMMMMMMMMMMMI             .8MMMMM.  MMMMMMMMMMMMMMMZ.ZMMMMI..... MM~~~:~~~~~~~~~~~~~~~~~~~~~~~~~
    .MMMNZ$$$$$$~ ..      . . .MMMMMMMM   ,MMMMMMMMMMMMMMMMMD  ..  .  NM:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    M8$$$$$$$$7   .       ...MMMMMMMMMM    MMMMMMMMMMMMMM8   .      IM7~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $$$$$$$$$.         ...DMMMMMMMMMMMMM:   $MMMMMMMMM=.  .        OM~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $$$$$$$$           . MMMMMMMMMMMMMMMMMI  .:MMMMZ  .   .       ,M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $$$$$$$.           .MMMMMMMMMMMMMMMMMMMMMMMMM+                D8~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $$$$$$.       .  .Z$MMMMMMMMMMMMMMMMMMMMMMM                   M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $$$$$ .      .  =$$$MMMMMMMMMMMMMMMMMMMMM:..                 M7~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $$$$.      .. $$$$$$MMMMMMMMMMMMMMMMMMM .                  .~M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $$$$        $$$$$$$$NMMMMMMMMMMMMMMMMN...                  .M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    ?$$$ .   I$$$$$$$$$$ZMMMMMMMMMMMMMMM:.                    .MO~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     $$$$$$$$$$$$$$$$$$$$MMMMMMMMMMMMMM:.                     =M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     $$$$$$$$$$$$$$$$$$$$MMMMMMMMMMMMM:                      MM:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     +$$$$$$$$$$$$$$$$$$$MMMMMMMMMMMMN.                    .MM~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      $$$$$$$$$$$$$$$$$$$ZMMMMMMMMMMD...                 . N~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      +$$$$$$$$$$$$$$$$$$$MMMMMMMMMM                   ..DM~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       $$$$$$$$$$$$$$$$$$$MMMMMMMMM$.                  NM~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        $$$$$$$$$$$$$$$$$$8MMMMMMMM .           .. .7MM+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        +$$$$$$$$$$$$$$$$$$MMMMMMM8            ZMMMO~:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
         Z$$$$$$$$$$$$$$$$$MMMMMMM        . ..MM:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          $$$$$$$$$$$$$$$$$ZMMMMMM...     ..$M=:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           $$$$$$$$$$$$$$$$$MMMMMM         OM~~:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            $$$$$$$$$$$$$$$$$MMMM$      . MN~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             $$$$$$$$$$$$$$$$MMMM=       8M::~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              =$$$$$$$$$$$$$$$MMM.      $M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Z$$$$$$$$$$$$$MMM=      M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 $$$$$$$$$$$$$$MMZ   ..M=:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                  =$$$$$$$$$$$$NMM    .M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    ~$Z$$$$$$$$$MM.. .M+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                      $$$$$$$$$$ZM7 ..M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        ?$$$$$$$$OM  .M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                          ?$$$$$$$MM. M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                             ~$$$$$NM M~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                77$$MM$M:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                    7$MMO~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                       ++N:~~~~~~~~~~~~~~~~~~~~~~

Made by badgers at [Code for America](http://codeforamerica.org)
