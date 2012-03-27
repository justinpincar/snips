$(function() {
    window.Snip = Backbone.Model.extend({});
    window.SnipsList = Backbone.Collection.extend({
	    model: Snip,
	    url: '/snips'
	});
    window.Snips = new SnipsList;

    window.TeamSnipsList = Backbone.Collection.extend({
	    model: Snip,
	    url: '/snips/team'
	});
    window.TeamSnips = new TeamSnipsList;

    window.User = Backbone.Model.extend({
	    urlRoot: '/users'
	});
    window.UsersList = Backbone.Collection.extend({
	    model: User,
	    url: '/users'
	});
    window.Users = new UsersList;

    window.SnipView = Backbone.View.extend({
	    tagName: "li",
	    className: "snip",

	    template: _.template(
				 "<span><%= model.get('user') %></span>" +
				 "<input type='text' class='snip-text' value='<%- model.get('content') %>' />" +
				 "<button class='snip-save'>Save</button>" +
				 "<span><%= model.get('team_id') %>: </span>" +
				 "<span><%= model.get('day') %></span>"
				 ),

	    events: {
		"click .snip-save": "save"
	    },

	    initialize: function() {
		_.bindAll(this, "render", "save");
		this.model.bind("change", this.render);
		this.model.view = this;
	    },

	    render: function() {
		$(this.el).html(this.template({model: this.model}));
		return this;
	    },

	    save: function() {
		this.model.save({content: this.$('.snip-text').val()});
	    }
	});

    window.MeView = Backbone.View.extend({
	    template: _.template(
				 "<h3>What did you do today?</h3>" +
				 "<% _.each(teams, function(team) { %>" +
				 "<div><%= team.name %>:</div><textarea id='team-<%= team.id %>-snippet' class='snippet-content'></textarea>" +
				 "<button class='save-snippet' data-team-id='<%= team.id %>'>Save</button>" +
				 "<% }) %>"
				 ),

	    events: {
		"click .save-snippet": "saveSnippet"
	    },

	    initialize: function() {
		_.bindAll(this, "saveSnippet", "render");
		this.render();
	    },

	    render: function() {
		$(this.el).html(this.template({teams: CurrentUser.get('teams')}));
		$('#content').html(this.el);
		return this;
	    },

	    saveSnippet: function(event) {
		var teamId = $(event.currentTarget).attr('data-team-id');
		Snips.create({
			snip: {
			    user_id: CurrentUser.id,
				content: this.$('#team-' + teamId + '-snippet').val(),
				day: Date.today().toString('yyyy-MM-dd'),
				team_id: teamId
				}
			    });

	    }
	});

    window.SnipsView = Backbone.View.extend({
	    initialize: function() {
		_.bindAll(this, "addOne", "addAll", "render");

		$('#content').html('');
		$(this.el).html('<div id="snips"><ul id="snips-list"></ul></div>');
		this.render();
	    },

	    render: function() {
		//alert("SnipsView#render");
		$('#content').html(this.el);

		Snips.bind("reset", this.addAll);

		Snips.fetch({
			success: function() {
			    Snips.unbind("reset");
			}

		    });


		return this;
	    },

	    addOne: function(snip) {
		var view = new SnipView({model: snip}).render().el;
		this.$('#snips-list').append(view);
	    },

	    addAll: function() {
		Snips.each(this.addOne);
	    },
	});

    window.TeamView = Backbone.View.extend({
	    initialize: function(teamId, day) {
		this.teamId = teamId;
		this.day = day;

		_.bindAll(this, "addOne", "addAll", "render");

		$('#content').html('');
		$(this.el).html('<div id="snips"><ul id="team-snips-list"></ul></div>');
		this.render();
	    },

	    render: function() {
		$('#content').html(this.el);

		TeamSnips.bind("reset", this.addAll);

		TeamSnips.fetch({data: {team_id: this.teamId, day: this.day}}, {
			success: function() {
			    TeamSnips.unbind("reset");
			}
		    });

		return this;
	    },

	    addOne: function(snip) {
		var view = new SnipView({model: snip}).render().el;
		this.$('#team-snips-list').append(view);
	    },

	    addAll: function() {
		if (TeamSnips.length > 0) {
		    TeamSnips.each(this.addOne);
		} else {
		    this.$('#team-snips-list').append($('<div>No Snips</div>'));
		}
	    },
	});


    window.LoginView = Backbone.View.extend({
	    el: '#snips-app',

	    template: _.template(
				 "<h3>Sign In</h3>" +
				 "<% _.each(users, function(user) { %><div class='user' data-user-id='<%= user.id %>'><%= user.get('nickname') %></div><% }) %>"
				 ),

	    events: {
		"click .user": "signIn"
	    },

	    initialize: function() {
		_.bindAll(this, "signIn", "render");

		Users.bind("reset", this.render);

		Users.fetch();
		this.render();
	    },

	    render: function() {
		this.$el.html(this.template({users: _.toArray(Users)}));
		return this;
	    },

	    signIn: function(event) {
		var userId = $(event.currentTarget).attr('data-user-id');
		window.CurrentUser = Users.get(userId);
		$.cookie("userId", CurrentUser.id, {expires: 7});
		window.SnipsAppView = new AppView;
		Backbone.history.start();
	    }
	});

    window.AppView = Backbone.View.extend({
	    el: '#snips-app',

	    template: _.template('<div id="sign-out">Sign Out</div>' +
				 '<div class="navigate" data-location="me"><%= user.get("nickname") %></div>' +
				 '<div class="navigate" data-location="list">List</div>' +
				 '<% _.each(user.get("teams"), function(team) { %><div class="navigate" data-location="team/<%= team.id %>"><%= team.name %></div><% }) %>' +
				 '<div class="previous">Previous</div>' +
				 '<div>Day: <%= date %></div>' +
				 '<div class="next">Next</div>' +
				 '<br /><br />' +
				 '<div id="content"></div>'),

	    events: {
		"click #sign-out": "signOut",
		"click .navigate": "navigate",
		"click .previous": "previous",
		"click .next": "next"
	    },

	    initialize: function() {
		_.bindAll(this, "next", "previous", "replaceView", "signOut", "render");

		this.currentView;
		this.render();

		key('i', function() {
			Backbone.history.navigate("me", {trigger: true});
		    });
		key('l', function() {
			Backbone.history.navigate("list", {trigger: true});
		    });
		key('j', function() {
			SnipsAppView.previous();
		    });
		key('k', function() {
			SnipsAppView.next();
		    });
	    },

	    render: function() {
		var date = Date.today().toString('yyyy-MM-dd');
		//		console.log(CurrentUser.teams);
		$(this.el).html(this.template({date: date, user: CurrentUser}));
	    },

	    navigate: function(event) {
		var location = $(event.currentTarget).attr('data-location');
		Backbone.history.navigate(location, {trigger: true});
	    },

	    replaceView: function(newView) {
		if (!this.currentView) {
		    return;
		}
		this.currentView.remove();
		this.currentView = newView;
	    },

	    previous: function() {
		fragment = Backbone.history.fragment;
		match = fragment.match(/\d{4}-\d{2}-\d{2}/);
		if (match) {
		    currentDay = Date.parse(match[0]);
		    hasDate = true;
		} else {
		    currentDay = Date.today();
		    hasDate = false;
		}

		day = currentDay.add(-1).days().toString('yyyy-MM-dd');

		var location = '';
		if (hasDate) {
		    location = fragment.replace(match[0], day);
		} else {
		    location = fragment + "/" + day;
		}

		Backbone.history.navigate(location, {trigger: true});
	    },

	    next: function() {
		fragment = Backbone.history.fragment;
		match = fragment.match(/\d{4}-\d{2}-\d{2}/);
		if (match) {
		    currentDay = Date.parse(match[0]);
		    hasDate = true;
		} else {
		    currentDay = Date.today();
		    hasDate = false;
		}

		day = currentDay.add(1).days().toString('yyyy-MM-dd');

		var location = '';
		if (hasDate) {
		    location = fragment.replace(match[0], day);
		} else {
		    location = fragment + "/" + day;
		}

		Backbone.history.navigate(location, {trigger: true});
	    },

	    signOut: function() {
		$.cookie("userId", null);
		location = '/';
	    }
	});

    window.Router = Backbone.Router.extend({
	    routes: {
		"list": "list",
		"team/:id": "team",
		"team/:id/:day": "team",
		"me": "me",
		"*splat": "list"
	    },

	    list: function() {
		SnipsAppView.replaceView(new SnipsView);
	    },

	    team: function(teamId, day) {
		SnipsAppView.replaceView(new TeamView(teamId, day));
	    },

	    me: function() {
		SnipsAppView.replaceView(new MeView);
	    }
	});

    new Router;
    var userId = $.cookie("userId");
    if (userId) {
	window.CurrentUser = new User({id: 1});
	CurrentUser.fetch({
		success: function() {
		    window.SnipsAppView = new AppView;
		    Backbone.history.start();
		},
		error: function() {
		    alert("Invalid user.");
		}
	    });
    } else {
	new LoginView;
    }

    $('body').on('keyup', 'input, textarea', function(event) {
	    // Trap 'escape' key
	    if (event.which == 27) {
		event.currentTarget.blur();
	    }
	});
    }());
