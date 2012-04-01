class Snip < ActiveRecord::Base
  belongs_to :user
  belongs_to :team

  attr_accessible :content, :day, :team_id, :user_id
end
