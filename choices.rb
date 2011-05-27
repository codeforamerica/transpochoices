require 'net/http'
require './fare.rb'

CALORIES_PER_SECOND_WALKING = 8/60.0  #dietary calories / sec
CALORIES_PER_SECOND_SITTING = 1.4/60.0 #dietary calories / sec
CALORIES_PER_KM_BIKING = 24 #dietary calories / km
BIKE_SPEED_IN_KM_PER_SECOND = 14 / 3600.0 #30 km/h into km/sec
CAMRY_MILEAGE = 35.406 #km / gallon
EMISSIONS_PER_GALLON = 8.788 #kg CO2/gallon gasoline
DOLLARS_PER_GALLON = 4.147 #USD
AAA_COST_PER_KM = 0.356 #USD/km
BIKING_COST_PER_KM = 0.07146 #USD/km

GTFS_MAPPING = {
	"San Francisco Municipal Transportation Agency"=>["MUNI_google_transit","SFMTA"],
	"Bay Area Rapid Transit"=>["BART_google_transit","BART"],
	"AirBART"=>["BART_google_transit","AirBART"]
}
def get_info_from_bing(params)
	base_url="http://dev.virtualearth.net/REST/v1/Routes/"
	query_params = "?wayPoint.1=#{params[:origin]}&waypoint.2=#{params[:destination]}&dateTime=#{Time.now.strftime("%H:%M")}&timeType=Arrival&key=#{ENV['BING_KEY']}"
	modes=%w{driving walking transit}
	
	results =modes.map do |mode|
		Thread.new do
			begin
				usable_url=URI.parse(URI.escape(base_url+mode+query_params))
				#puts "calling url #{usable_url}"
				response = JSON.parse(Net::HTTP.get(usable_url))
	
				resource = response["resourceSets"][0]["resources"][0]
				info = {
					:distance=>resource["travelDistance"],
					:duration=>resource["travelDuration"]
				}
				[mode,resource]
			rescue
				[mode,nil]
			end
		end
	end
	results.map!(&:value)
	Hash[*results.flatten]
end

def generic_by_bing_resource(resource)
	{
		:distance=>resource["travelDistance"],
		:duration=>resource["travelDuration"]
	}
end

def calculate_transit_by_bing_resource(resource)
	info_by_type = resource["routeLegs"].map do |leg|
		leg["itineraryItems"].map do |item|
			type = item["details"][0]["maneuverType"]
			type = "TakeTransit" if type == "Transfer" #HACK FOR NOW
			{
				:type=>type,
				:distance=>item["travelDistance"],
				:duration=>item["travelDuration"],
				:item=>item
			}
		end
	end.flatten.group_by {|i| i[:type]}
	
	walking_duration = info_by_type["Walk"].inject(0) {|s,x| s+x[:duration]}
	transit_duration = info_by_type["TakeTransit"].inject(0) {|s,x| s+x[:duration]}
	
	#calculate the total fare
	#look at a TakeTransit, it has:
		#child itinerary items, with [details][maneuverType] == TransitDepart and TransitArrive, each with [details][names] = [station name]
		#[transitLine][agencyName] == agency name
		#[transitLine][abbreviatedName/verboseName] == route name of some sort.
	#general strategy:
		#chunk up the routes by agency
		#sum: for each agency, parse up the fares, then calculate the best fare for that series of rides.
	puts "all info = "
	require 'pp'
	pp info_by_type
	
	cost = info_by_type["TakeTransit"].map {|x| x[:item]}.chunk {|x| (x["transitLine"] || {})["agencyName"]}.inject(0)  do |sum,(agency,agency_chunk)|
		puts "doing: #{agency}"
		dir,agency_id = GTFS_MAPPING[agency]
		#fares_for(agency)
		
		fares = Fare.load(dir+"/fare_attributes.txt",dir+"/fare_rules.txt") #todo: check that rules exist
		fares = fares[agency_id] || fares[nil]
		#puts "fares = "
		
		#pp fares
		
		routes = csv_to_hash(dir+"/routes.txt")
		stops = csv_to_hash(dir+"/stops.txt")
		
		rides = agency_chunk.map do |itinerary_item|
			start=itinerary_item["childItineraryItems"][0] #horrible assumption here, should check maneuvertype or something
			finish=itinerary_item["childItineraryItems"][1]

			Ride.new(:start_time=>0, #fancy_parse(start["time"]), TODO: actually parse time, don't give infinite transfer capability
				:end_time=>0, #fancy_parse(finish["time"]),
				:origin=>      stops.find {|s| s["stop_name"].to_s.close_to? start["details"][0]["names"][0]}["zone_id"],
				:destination=> stops.find {|s| s["stop_name"].to_s.close_to? finish["details"][0]["names"][0]}["zone_id"],
				:route=>routes.find {|r| r["agency_id"]==agency_id && r["route_long_name"] == itinerary_item["transitLine"]["verboseName"]}["route_id"])
		end
		#puts "got some rides:"
		#require 'pp'
		#pp rides
		sum += best_fare(rides,fares)
	end.to_f
	
	{
		:duration=>resource["travelDuration"],
		:calories=>walking_duration * CALORIES_PER_SECOND_WALKING + transit_duration * CALORIES_PER_SECOND_SITTING,
		:emissions=>nil,
		:cost=>cost
	}
end


get "/info_for_route_bing" do
	results = get_info_from_bing(params)
	
	if params[:raw_data]=="yes_please"
		puts "here"
		return [200,{},JSON.pretty_generate(results)] 
	end
	
	if (resource=results["driving"])
		results["driving"]=generic_by_bing_resource(resource)
		gas_consumed = results["driving"][:distance] / CAMRY_MILEAGE
		results["driving"][:emissions] = (gas_consumed * EMISSIONS_PER_GALLON).round(5)
		results["driving"][:cost] = (results["driving"][:distance] * AAA_COST_PER_KM).round(2)
		results["driving"][:calories] = (results["driving"][:duration] * CALORIES_PER_SECOND_SITTING).round(2)
	end
	if (resource=results["walking"])
		results["walking"]=generic_by_bing_resource(resource)
		results["walking"][:calories]=(results["walking"][:duration] * CALORIES_PER_SECOND_WALKING).round(1)
		results["walking"][:emissions]=0
		results["walking"][:cost]=0
		
		results["biking"]=generic_by_bing_resource(resource)
		results["biking"][:duration] = (results["biking"][:distance] / BIKE_SPEED_IN_KM_PER_SECOND).round(0)
		results["biking"][:calories] = results["biking"][:distance] * CALORIES_PER_KM_BIKING
		results["biking"][:emissions] = 0
		results["biking"][:cost]= (results["biking"][:distance] * BIKING_COST_PER_KM).round(2)
	end
	if (resource=results["transit"])
		results["transit"] = calculate_transit_by_bing_resource(resource)
	end
	
	output = {:units=>
		{
			:distance=>"km",
			:duration=>"sec",
			:emissions=>"kg_co2",
			:cost=>"usd",
			:calories=>"cal"
		},
		:results=>results
	}
	[200,{},JSON.pretty_generate(output)]
end

get "/" do
	File.read(File.join('public', 'index.html'))
end