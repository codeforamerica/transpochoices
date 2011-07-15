require 'bundler'
Bundler.require
require 'webmock/rspec'
require 'rack/test'

require './choices.rb'
ENV['RACK_ENV'] = 'test'

include Rack::Test::Methods
def app
	Sinatra::Application
end

def fixture_path
	File.expand_path("../fixtures", __FILE__)
end

def fixture(file)
	File.new(fixture_path + '/' + file)
end
