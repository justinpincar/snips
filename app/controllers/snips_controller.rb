class SnipsController < ApplicationController
  def index

    render :json => @snips
  end
end
