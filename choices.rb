require 'net/http'

CALORIES_PER_SECOND_WALKING = 8/60.0  #dietary calories / sec
CALORIES_PER_SECOND_SITTING = 1.4/60.0 #dietary calories / sec
BIKE_SPEED_IN_KM_PER_SECOND = 30 / 3600.0 #30 km/h into km/sec
CAMRY_MILEAGE = 35.406 #km / gallon
EMISSIONS_PER_GALLON = 8.788 #kg CO2/gallon gasoline
DOLLARS_PER_GALLON = 4.147 #USD
AAA_COST_PER_KM = 0.356 #USD/km
BIKING_COST_PER_KM = 0.07146 #USD/km
def get_info_from_bing(params)
	base_url="http://dev.virtualearth.net/REST/v1/Routes/"
	query_params = "?wayPoint.1=#{params[:origin]}&waypoint.2=#{params[:destination]}&dateTime=#{Time.now.strftime("%H:%M")}&timeType=Arrival&key=#{ENV['BING_KEY']}"
	modes=%w{driving walking transit}
	
	results =modes.map do |mode|
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
			{
				:type=>item["details"][0]["maneuverType"],
				:distance=>item["travelDistance"],
				:duration=>item["travelDuration"]
			}
		end
	end.flatten.group_by {|i| i[:type]}
	
	{
		:duration=>resource["travelDuration"],
		:while_walking=>{
			:distance => info_by_type["Walk"].inject(0) {|s,x| s+x[:distance]},
			:duration => info_by_type["Walk"].inject(0) {|s,x| s+x[:duration]}
		},
		:while_transit=>{
			:duration => info_by_type["TakeTransit"].inject(0) {|s,x| s+x[:duration]}
		}
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
		#results["biking"][:calories] = results["biking"][:distance]
		results["biking"][:emissions] = 0
		results["biking"][:cost]= (results["biking"][:distance] * BIKING_COST_PER_KM).round(2)
	end
	if (resource=results["transit"])
		results["transit"] = calculate_transit_by_bing_resource(resource)
		results["transit"][:calories] = results["transit"][:while_walking][:calories] = results["transit"][:while_walking][:duration] * CALORIES_PER_SECOND_WALKING
	end
	
	output = {:units=>
		{
			:distance=>"kilometers",
			:duration=>"seconds",
			:emissions=>"kg of CO2",
			:cost=>"USD",
			:calories=>"calories"
		},
		:results=>results
	}
	[200,{},JSON.pretty_generate(output)]
end

get "/" do
	File.read(File.join('public', 'index.html'))
end