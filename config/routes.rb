Snips::Application.routes.draw do
  resources :snips, :only => [:index]
  resources :users, :only => [:index]
end
