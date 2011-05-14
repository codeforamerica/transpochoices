require 'csv'
require 'bigdecimal'
require 'set'

class Fare
	#attributes
	attr_accessor :agency_id, :fare_id, :price, :currency, :payment_method, :rules_specified
	#rules
	attr_accessor :transfers, :transfer_duration
	attr_accessor :covered_routes, :zone_pairs, :contained_zones
	
	def initialize(args_hash)
		args_hash.each do |k,v|
			self.instance_variable_set("@#{k}".to_sym,v)
		end
		
		if @price
			@price = BigDecimal.new(@price)
		end
		
		if @rules_specified
			@covered_routes ||= []
			@zone_pairs ||= []
			@contained_zones ||=[]
		end
	end
	
	def matches?(rides)
		return false if @transfers && rides.length > (transfers+1)
		return false if @transfer_duration && (rides.last.end_time - rides.first.start_time) > @transfer_duration
		
		return true if !@rules_specified
		
		return (@covered_routes.empty? || rides.map(&:route).to_set.subset?(@covered_routes)) &&
			(@zone_pairs.empty? || @zone_pairs.find {|(origin,destination)| (origin.nil? || origin==rides.first.origin) && (destination.nil? || destination==rides.last.destination)}) &&
			(@contained_zones.empty? || rides.map {|r| [r.origin,r.destination]}.flatten.to_set == @contained_zones)
	end
	
	def self.load(attributes_file,rules_file=nil)
		att = CSV.read(attributes_file)
		att_headers = att.shift
		
		if rules_file
			rules = CSV.read(rules_file)
			rules_headers = rules.shift
			rules = rules.map do |row|
				Hash[*rules_headers.zip(row).flatten]
			end.group_by {|r| r["fare_id"]}
		end
		
		return att.map do |row|
			attributes = Hash[*att_headers.zip(row).flatten]
			attributes.merge!({:rules_specified => !!rules_file})
			
			fare = self.new(attributes)
			
			if rules
				my_rules = rules[fare.fare_id]
				if my_rules
					fare.covered_routes = my_rules.map {|r| r["route_id"]}.to_set
					fare.zone_pairs = my_rules.map {|r| [r["origin_id"],r["destination_id"]]}.to_set
					fare.contained_zones = my_rules.map {|r| r["contains_id"]}.to_set
				else
					fare.rules_specified=false
				end
			end
			fare
		end.group_by {|fare| fare.agency_id}
	end
end

class Ride
	attr_accessor :start_time, :end_time, :origin, :destination, :route
	def initialize(args_hash)
		args_hash.each do |k,v|
			self.instance_variable_set("@#{k}".to_sym,v)
		end
	end
end