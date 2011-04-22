require 'net/http'

def get_info_from_bing(params)
	base_url="http://dev.virtualearth.net/REST/v1/Routes/"
	query_params = "?wayPoint.1=#{params[:origin]}&waypoint.2=#{params[:destination]}&dateTime=#{Time.now.strftime("%H:%M")}&timeType=Arrival&key=#{ENV['BING_KEY']}"
	modes=%w{driving walking transit}
	
	results =modes.map do |mode|
		begin
			usable_url=URI.parse(URI.escape(base_url+mode+query_params))
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
	end
	if (resource=results["walking"])
		results["walking"]=generic_by_bing_resource(resource)
		results["biking"]=generic_by_bing_resource(resource)
		results["biking"]["travelDuration"] /= 4.0
	end
	if (resource=results["transit"])
		results["transit"] = calculate_transit_by_bing_resource(resource)
	end
	
	output = {:units=>
		{
			:distance=>"kilometers",
			:duration=>"seconds",
			:emissions=>"milliliters of innocent bunny blood",
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