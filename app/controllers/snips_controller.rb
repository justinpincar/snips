class SnipsController < ApplicationController
  def index
    snips = Snip.all
    render :json => snips
  end

  def create
    snip = Snip.create!(params[:snip])
    render :json => snip
  end

  def team
    team = Team.find(params[:team_id])
    day = params[:day] || Date.today
    snips = Snip.where(:team_id => team.id, :day => day)
    render :json => snips
  end
end
