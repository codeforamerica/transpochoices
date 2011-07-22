require 'helper'

describe "get info" do

	before :each do
		ENV['BING_KEY'] = "test_key"
		
		@boston_params = {:origin => "1 State St, Boston, MA 02109, USA", :destination => "1 Kneeland St, Boston, MA 02111, USA", :time=>"11:51"}
		@base_url = "http://dev.virtualearth.net/REST/v1/Routes/"
		@boston_bing_query = "?wayPoint.1=1%20State%20St,%20Boston,%20MA%2002109,%20USA&waypoint.2=1%20Kneeland%20St,%20Boston,%20MA%2002111,%20USA&dateTime=11:51&timeType=Arrival&key=test_key"
		#stub the boston requests
		%w(transit driving walking).each do |mode|
			stub_request(:get,"#{@base_url}#{mode}#{@boston_bing_query}").
			to_return(:body=>fixture("boston_#{mode}.json"))
		end
	end
	
	it "should make bing requests for each of the transit modes" do
		get_info_from_bing(@boston_params)
		%w(transit driving walking).each do |mode|
			a_request(:get,"#{@base_url}#{mode}#{@boston_bing_query}").should have_been_made
		end
	end
	
	#pending for now, we don't have fare info for boston.
	pending "should calculate fare for transit" do
		get "/info_for_route_bing", @boston_params
		JSON.parse(last_response.body)["results"]["transit"]["cost"].should == 3 #or whatever number.
	end
	
	it "should return null fare when transit GTFS data is unavailable" do
		stub_request(:get,"#{@base_url}transit#{@boston_bing_query}").
			to_return(:body=>fixture("nonexist_transit.json"))
		get "/info_for_route_bing", @boston_params
		JSON.parse(last_response.body)["results"]["transit"]["cost"].should be_nil
	end
	
	describe "seattle multi-city" do
		before :each do
			@seattle_bing_query = "?wayPoint.1=Seattle,%20WA,%20USA&waypoint.2=Everett,%20WA,%20USA&dateTime=13:33&timeType=Arrival&key=test_key"
			@seattle_params = {:origin=>"Seattle, WA, USA",:destination=>"Everett, WA, USA", :time=>"13:33"}
			
			%w(driving walking).each do |mode|
				stub_request(:get,"#{@base_url}#{mode}#{@seattle_bing_query}").
				to_return(:body=>"[]")
			end
			stub_request(:get,"#{@base_url}transit#{@seattle_bing_query}").
				to_return(:body=>fixture("failing_seattle.json"))
		end
		
		it "shouldn't fail" do
			get "/info_for_route_bing", @seattle_params
			JSON.parse(last_response.body)["results"]["transit"].should_not be_nil
		end
	end
end