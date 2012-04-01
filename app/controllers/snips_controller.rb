class SnipsController < ApplicationController
  def index
    snips = Snip.all
    render :json => snips, :include => [:user]
  end

  def create
    snip = Snip.create!(params)
    render :json => snip, :include => [:user]
  end

  def update
    snip = Snip.find(params[:id])
    snip.update_attributes(params)
    render :json => snip, :include => [:user]
  end

  def group
    group = Group.find(params[:group_id])
    day = params[:day] || Date.today

    snips = []
    group.teams.each do |team|
      snips += team.snips.where(:day => day)
    end

    render :json => snips, :include => [:user]
  end

  def team
    team = Team.find(params[:team_id])
    day = params[:day] || Date.today
    snips = team.snips.where(:day => day)
    render :json => snips, :include => [:user]
  end

  def user
    user = User.find(params[:user_id])
    day = params[:day] || Date.today
    snips = user.snips.where(:day => day)
    render :json => snips, :include => [:user]
  end
end
