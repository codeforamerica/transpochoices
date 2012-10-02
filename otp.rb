require 'cgi'
require 'net/http'
require 'json'
require 'pp'
require './constants'

# Is this point within the configured bbox of an OTP instance?
def has_otp_config(lat, lon)
  # Disabling OTP for the time being. Not ready for prime time.
  return false

  match = OTP_MAPPING.select {|m| lon >= m["bbox"]["min_lon"] && lon <= m["bbox"]["max_lon"] &&
                                  lat >= m["bbox"]["min_lat"] && lat <= m["bbox"]["max_lat"] }
  !match.empty?
end

# Get the base url for the OTP instance for this point
def get_otp_url(lat, lon)
  match = OTP_MAPPING.select {|m| lon >= m["bbox"]["min_lon"] && lon <= m["bbox"]["max_lon"] &&
                                  lat >= m["bbox"]["min_lat"] && lat <= m["bbox"]["max_lat"] }
  match.first["url"] if !match.empty?
end

# Get the important data from OTP
def get_info_from_otp(params)
  base_url=get_otp_url(params[:origin][0], params[:origin][1])

  # Do we have a url?
  if (!base_url.nil?)

    # Params to pas to OTP
    query_params = "plan?" + {
      "arriveBy" => "false",
      "date" => params[:date] || Date.today.strftime("%m/%d/%Y"),
      "time" => params[:time] || Time.now.strftime("%I:%M %p"),
      "mode" => "TRANSIT,WALK",
      "optimize" => "QUICK",
      "maxWalkDistance" => "1260",
      "toPlace" => params[:origin].join(","),
      "fromPlace" => params[:destination].join(",")
    }.map {|k,v| "#{k}=#{CGI.escape(v)}"}*"&"

    uri = URI.parse(base_url+query_params)
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Get.new(uri.request_uri)
    # Be sure to ask for JSON
    request.initialize_http_header({"Accept" => "application/json"})

    # puts "calling url #{uri}"
    res = JSON.parse(http.request(request).body)

    # TODO: make this more elegant when the fare data is better understood
    begin
      cost = res["plan"]["itineraries"].first["fare"]["fare"]["regular"]["cents"].fdiv(100)
    rescue Exception => e
      cost = nil
    end

    {
      :walk_duration => res["plan"]["itineraries"].first["walkTime"],
      :transit_duration => res["plan"]["itineraries"].first["transitTime"],
      :wait_duration => res["plan"]["itineraries"].first["waitingTime"],
      :duration => res["plan"]["itineraries"].first["duration"].fdiv(1000),
      :cost => cost
    }
  end
end