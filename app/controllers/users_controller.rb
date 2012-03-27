class UsersController < ApplicationController
  def index
    users = User.all
    render :json => users, :include => [:teams]
  end

  def show
    user = User.find(params[:id])
    render :json => user, :include => [:teams]
  end
end
