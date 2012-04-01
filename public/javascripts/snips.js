$(function() {
    window.Today = function() {
	return Date.today().toString('yyyy-MM-dd');
    };

    window.Group = Backbone.Model.extend({});
    window.GroupsList = Backbone.Collection.extend({
	    model: Group,
	    url: '/groups'
	});
    window.Groups = new GroupsList;

    window.Snip = Backbone.Model.extend({});
    window.SnipsList = Backbone.Collection.extend({
	    model: Snip,
	    url: '/snips'
	});
    window.Snips = new SnipsList;

    window.GroupSnipsList = Backbone.Collection.extend({
	    model: Snip,
	    url: '/snips/group'
	});
    window.GroupSnips = new GroupSnipsList;

    window.TeamSnipsList = Backbone.Collection.extend({
	    model: Snip,
	    url: '/snips/team'
	});
    window.TeamSnips = new TeamSnipsList;

    window.UserSnipsList = Backbone.Collection.extend({
	    model: Snip,
	    url: '/snips/user'
	});
    window.UserSnips = new UserSnipsList;

    window.User = Backbone.Model.extend({
	    urlRoot: '/users'
	});
    window.UsersList = Backbone.Collection.extend({
	    model: User,
	    url: '/users'
	});
    window.Users = new UsersList;

    window.SnipView = Backbone.View.extend({
	    template: _.template(
				 "<dt><%= model.get('user').nickname %></dt>" +
				 "<dd><%= model.get('content').replace(/\n/g, '<br />') %></dd>"
				 ),

	    initialize: function() {
		_.bindAll(this, "render");
		this.model.view = this;
	    },

	    render: function() {
		$(this.el).html(this.template({model: this.model}));
		return this;
	    },
	});

    window.MeView = Backbone.View.extend({
	    template: _.template(
				 '<div class="row">' +
				 '<div class="span8 offset2 well">' +

				 "<% _.each(teams, function(team) { %>" +
				 '<form class="form-horizontal">' +
				 '<fieldset>' +
				 '<div class="row">' +
				 '<div class="span8">' +
				 '<div class="control-group">' +
				 '<label class="control-label" for="textarea"><%= team.name %></label>' +
				 '<div class="controls">' +
				 '<textarea style="width: 100%" id="team-<%= team.id %>-snippet" rows="4"></textarea>' +
				 '</div>' +
				 '</div>' + 
				 "<button class='btn save-snippet pull-right' data-team-id='<%= team.id %>'>Save</button>" +
				 '</div>' +
				 '</div>' +
				 '</fieldset>' +
				 '</form>' +
				 "<% }) %>" +

				 '</div>' +
				 '</div>'
				 ),

	    events: {
		"click .save-snippet": "saveSnippet"
	    },

	    initialize: function(day) {
		this.day = day;

		_.bindAll(this, "loadSnippets", "saveSnippet", "render");
		this.render();
	    },

	    render: function() {
		this.setTitle(CurrentUser.get('nickname'), this.day);
		$(this.el).html(this.template({teams: CurrentUser.get('teams')}));
		$('#content').html(this.el);

		UserSnips.bind("reset", this.loadSnippets);
		UserSnips.fetch({data: {user_id: CurrentUser.id, day: this.day}}, {
			success: function() {
			    UserSnips.unbind("reset");
			}
		    });

		return this;
	    },

	    loadSnippets: function(event) {
		UserSnips.each(function(snip) {
			$('#team-' + snip.get('team_id') + '-snippet').val(snip.get('content'));
		    });
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
		$(this.el).html('<div><ul id="snips-list"></ul></div>');
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

    window.GroupView = Backbone.View.extend({
	    initialize: function(groupId, day) {
		this.groupId = groupId;
		this.day = day;

		_.bindAll(this, "addOne", "addAll", "render");

		$('#content').html('');
		this.render();
	    },

	    template: _.template(
				 '<div class="row">' +
				 '<div class="span8 offset2 well">' +
				 '<div><ul id="group-snips-list"></ul></div>' +
				 '</div>' +
				 '</div>'
				  ),

	    render: function() {
		this.$el.html(this.template());
		this.setTitle("Group: " + this.groupId, this.day);

		$('#content').html(this.el);

		GroupSnips.bind("reset", this.addAll);

		GroupSnips.fetch({data: {group_id: this.groupId, day: this.day}}, {
			success: function() {
			    GroupSnips.unbind("reset");
			}
		    });

		return this;
	    },

	    addOne: function(snip) {
		var view = new SnipView({model: snip}).render().el;
		this.$('#group-snips-list').append(view);
	    },

	    addAll: function() {
		if (GroupSnips.length > 0) {
		    GroupSnips.each(this.addOne);
		} else {
		    this.$('#group-snips-list').append($('<div>No Snips</div>'));
		}
	    },
	});

    window.TeamView = Backbone.View.extend({
	    initialize: function(teamId, day) {
		this.teamId = teamId;
		this.day = day;

		_.bindAll(this, "addOne", "addAll", "render");

		$('#content').html('');
		this.render();
	    },

	    template: _.template(
				 '<div class="row">' +
				 '<div class="span8 offset2 well">' +
				 '<div><ul id="team-snips-list"></ul></div>' +
				 '</div>' +
				 '</div>'
				 ),

	    render: function() {
		this.setTitle("Team: " + this.teamId, this.day);
		this.$el.html(this.template());
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
				 '<div class="span6 offset3 well">' +
				 '<h2>Welcome to Snips!</h2>' +
				 '<br />' +
				 '<div class="btn-group">' +
				 '<a class="btn btn-large dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-user"></i> Sign In <span class="caret"></span></a>' +
				 '<ul class="dropdown-menu">' +
				 
				 "<% _.each(users, function(user) { %><li><a href='#' class='user' data-user-id='<%= user.id %>'><%= user.get('nickname') %></a></li><% }) %>" +

				 '</ul>' +
				 '</div>' +
				 '</div>'

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

	    template: _.template('<div id="header">' +
				 '<ul class="nav nav-pills pull-right">' +
				 '<li><a id="nickname" class="navigate" data-location="me"><%= user.get("nickname") %></a> ' +
				 '<li><a id="sign-out" href="#">Sign Out</a>' +
				 '</ul>' +

				 '<div class="row">' +

				 '<div class="span3">' +
				 '<h3>Groups</h3> <ul id="groups" class="nav nav-pills"></ul>' +
				 '</div>' +

				 '<div class="span3">' +
				 '<h3>Teams</h3>' +
				 '<ul id="teams" class="nav nav-pills">' +
				 '<% _.each(user.get("teams"), function(team) { %><li><a href="#team/<%= team.id %>"><%= team.name %></button><% }) %></a></li>' +
				 '</ul>' +
				 '</div>' +

				 '</div>' +


				 '<div class="row">' +
				 '<div class="span8 offset2" style="padding-left: 19px">' +
				 '<div id="title"></div>' +
				 '</div>' +
				 '</div>' +

				 '</div>' +
				 '<div id="content"></div>' +


				 '<div class="row">' +
				 '<div class="span8 offset2" style="padding-left: 19px">' +
				 '<ul class="pager">' +
				 '<li class="previous"><a>&larr; Older</a></li>' +
				 '<li><button class="btn btn-info" data-toggle="modal" data-target="#info-modal">Info <i class="icon-info-sign icon-white"></i></button></li>' +
				 '<li class="next"><a>Newer &rarr;</a></li>' +
				 '</ul>' +
				 '</div>' +
				 '</div>' +

				 '<div id="info-modal" class="modal fade">' +
				 '<div class="modal-header">' +
				 '<a class="close" data-dismiss="modal">x</a>' +
				 '<h3>Tips and Tricks</h3>' +
				 '</div>' +
				 '<div class="modal-body">' +
				 '<h4>Use Keyboard Shortcuts</h4>' +
				 '<p>' +
				 '<p><strong>j</strong> - Previous day</p>' +
				 '<p><strong>k</strong> - Next day</p>' +
				 '<p><strong>i</strong> - Your view</p>' +
				 '<p><strong>l</strong> - List view</p>' +
				 '</p>' +
				 '</div>' +
				 '<div class="modal-footer">' +
				 '<button href="#" class="btn" data-dismiss="modal">Close</button>' +
				 '</div>' +
				 '</div>'
				 ),

	    events: {
		"click #sign-out": "signOut",
		"click .navigate": "navigate",
		"click .previous": "previous",
		"click .next": "next"
	    },

	    initialize: function() {
		_.bindAll(this, "loadGroups", "next", "previous", "replaceView", "signOut", "render");

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
		$(this.el).html(this.template({date: date, user: CurrentUser}));

		Groups.bind("reset", this.loadGroups);
		Groups.fetch();
	    },

	    loadGroups: function(event) {
		Groups.each(function(group) {
			$('#groups').append($('<li><a href="#group/' + group.id + '">' + group.get('name') + '</a></li>'));
		    });
	    },

	    navigate: function(event) {
		fragment = Backbone.history.fragment;
		match = fragment.match(/\d{4}-\d{2}-\d{2}/);
		if (match) {
		    currentDay = match[0]
		} else {
		    currentDay = Today();
		}

		var location = $(event.currentTarget).attr('data-location');
		location = location + "/" + currentDay;

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
		"group/:id": "group",
		"group/:id/:day": "group",
		"team/:id": "team",
		"team/:id/:day": "team",
		"me": "me",
		"me/:day": "me",
		"*splat": "splat"
	    },

	    splat: function() {
		Backbone.history.navigate("group/1", {trigger: true});
	    },

	    group: function(groupId, day) {
		if (typeof(day) == 'undefined') {
		    Backbone.history.navigate("group/" + groupId + "/" + Today(), {trigger: true});
		    return;
		}

		SnipsAppView.replaceView(new GroupView(groupId, day));
	    },

	    team: function(teamId, day) {
		if (typeof(day) == 'undefined') {
		    Backbone.history.navigate("team/" + teamId + "/" + Today(), {trigger: true});
		    return;
		}

		SnipsAppView.replaceView(new TeamView(teamId, day));
	    },

	    me: function(day) {
		if (typeof(day) == 'undefined') {
		    Backbone.history.navigate("me/" + Today(), {trigger: true});
		    return;
		}

		SnipsAppView.replaceView(new MeView(day));
	    }
	});

    _.extend(Backbone.View.prototype, {
	    setTitle: function(title, subtitle) {
		if (typeof(subtitle) !== 'undefined') {
		    title += ' <small>' + subtitle + '</small>';
		}

		$('#title').html(
				 '<div class="page-header">' +
				 '<h3>' + title + '</h3>' +
				 '</div>'
				 );
	    }
	});

    new Router;
    var userId = $.cookie("userId");
    if (userId) {
	window.CurrentUser = new User({id: userId});
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
