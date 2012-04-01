Snips::Application.routes.draw do
  resources :groups, :only => [:index, :show]

  resources :snips, :only => [:create, :index, :update] do
    collection do
      get :group
      get :team
      get :user
    end
  end

  resources :teams, :only => [:index, :show]
  resources :users, :only => [:index, :show]
end
