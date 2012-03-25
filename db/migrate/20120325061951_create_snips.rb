class CreateSnips < ActiveRecord::Migration
  def change
    create_table :snips do |t|
      t.integer :user_id
      t.integer :team_id
      t.date :day
      t.text :content
      t.timestamps
    end
  end
end
