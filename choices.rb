require 'net/http'
require './fare.rb'
require './constants.rb'

require 'pp'
def get_info_from_bing(params)
	base_url="http://dev.virtualearth.net/REST/v1/Routes/"
	query_params = "?wayPoint.1=#{params[:origin]}&waypoint.2=#{params[:destination]}&dateTime=#{params[:time] || Time.now.strftime("%H:%M")}&timeType=Arrival&key=#{ENV['BING_KEY']}"
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
	#puts "all info = "
	#require 'pp'
	#pp info_by_type
	
	cost = info_by_type["TakeTransit"].map {|x| x[:item]}.chunk {|x| (x["transitLine"] || {})["agencyName"]}.inject(0)  do |sum,(agency,agency_chunk)|
		#puts "doing: #{agency}"
		dir,agency_id = GTFS_MAPPING[agency]
		#fares_for(agency)
		
		fares = Fare.load(dir+"/fare_attributes.txt",dir+"/fare_rules.txt") #todo: check that rules exist
		fares = fares[agency_id] || fares[nil]
		
		routes = csv_to_hash(dir+"/routes.txt")
		stops = csv_to_hash(dir+"/stops.txt")
		
		rides = agency_chunk.map do |itinerary_item|
			#puts "itinerary = "
			#pp itinerary_item
			
			start=itinerary_item["childItineraryItems"][0] #horrible assumption here, should check maneuvertype or something
			finish=itinerary_item["childItineraryItems"][1]

			Ride.new(:start_time=>0, #fancy_parse(start["time"]), TODO: actually parse time, don't give infinite transfer capability
				:end_time=>0, #fancy_parse(finish["time"]),
				:origin=>      stops.find {|s| s["stop_name"].to_s.close_to? start["details"][0]["names"][0]}["zone_id"],
				:destination=> stops.find {|s| s["stop_name"].to_s.close_to? finish["details"][0]["names"][0]}["zone_id"],
				:route=>(routes.find {|r| r["agency_id"]==agency_id && r.values_at("route_long_name","route_short_name").include?(itinerary_item["transitLine"]["verboseName"])} || {})["route_id"])
		end
		#puts "got some rides for #{agency}:"
		#pp rides
		fare = best_fare(rides,fares)
		break nil if fare.nil?
		sum += fare
	end
	
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
		#puts "here"
		return [200,{},JSON.pretty_generate(results)] 
	end
	
	if (resource=results["driving"])
		results["driving"]=generic_by_bing_resource(resource)
		gas_consumed = results["driving"][:distance] / CAMRY_MILEAGE
		results["driving"][:emissions] = (gas_consumed * EMISSIONS_PER_GALLON).round(5)
		results["driving"][:cost] = (results["driving"][:distance] * AAA_COST_PER_KM).round(2)
		results["driving"][:calories] = (results["driving"][:duration] * CALORIES_PER_SECOND_SITTING).round(2)
		
		results["taxi"]=results["driving"].clone
		#taxi is like driving, but with a taxi rate
		start_point = resource["routeLegs"][0]["actualStart"]["coordinates"]
		closest_rate = TAXI_RATES.sort_by {|rate| (rate[:lat]-start_point[0])**2 + (rate[:lon]-start_point[1])**2}.first
		puts "closest_rate = #{closest_rate.inspect}"
		approx_time_waiting = [(results["taxi"][:duration] - results["taxi"][:distance] * AVG_CAR_SPEED),0].max
		results["taxi"][:cost] = (closest_rate[:initial_charge] + closest_rate[:per_km] * (results["taxi"][:distance] - closest_rate[:initial_increment_km]) + (approx_time_waiting/3600) * closest_rate[:per_hour_waiting]).round(2)
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