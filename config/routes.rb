Snips::Application.routes.draw do
  resources :snips, :only => [:create, :index] do
    collection do
      get :team
    end
  end

  resources :users, :only => [:index, :show]
end
