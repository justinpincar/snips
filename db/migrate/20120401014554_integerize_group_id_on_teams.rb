class IntegerizeGroupIdOnTeams < ActiveRecord::Migration
  def up
    remove_column :teams, :group_id
    add_column :teams, :group_id, :integer
  end

  def down
    remove_column :teams, :group_id
    add_column :teams, :group_id, :string
  end
end
