require 'net/http'

get "/info_for_route" do
	base_url="http://maps.googleapis.com/maps/api/directions/json?origin=#{params[:origin]}&destination=#{params[:destination]}&sensor=false"
	modes=%w{driving walking bicycling}
	results =modes.map do |mode|
		response = JSON.parse(Net::HTTP.get(URI.parse(base_url+"&mode=#{mode}")))
		legs=response["routes"][0]["legs"]
		info={
			:distance=>{:unit=>"meters",:value=>legs.inject(0) {|s,x| s+x["distance"]["value"]}},
			:duration=>{:unit=>"seconds",:value=>legs.inject(0) {|s,x| s+x["duration"]["value"]}}
		}
		[mode,info]
	end
	results = Hash[*results.flatten]
	
	results["driving"].merge!({
		:emmisions=>{:unit=>"bunnies killed",:value=>1},
		:cost=>{:unit=>"USD",:value=>1}
	})
	results["walking"].merge!({
		:emmisions=>{:unit=>"bunnies killed",:value=>3},
		:cost=>{:unit=>"USD",:value=>2}
	})
	results["bicycling"].merge!({
		:emmisions=>{:unit=>"bunnies killed",:value=>5},
		:cost=>{:unit=>"USD",:value=>4}
	})
	
	[200,{},results.to_json]
end

get "/" do
	File.read(File.join('public', 'index.html'))
end