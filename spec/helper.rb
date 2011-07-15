require 'rspec'
require 'webmock/rspec'

require 'bundler'
Bundler.require

require './choices.rb'

def fixture_path
	File.expand_path("../fixtures", __FILE__)
end

def fixture(file)
	File.new(fixture_path + '/' + file)
end
