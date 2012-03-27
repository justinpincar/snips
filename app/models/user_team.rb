class UserTeam < ActiveRecord::Base
  belongs_to :team
  belongs_to :user

  validates_presence_of :team
  validates_presence_of :user
end
