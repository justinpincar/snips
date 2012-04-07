$(function() {
    window.setTitle = function(title, subtitle) {
	if (typeof(subtitle) !== 'undefined') {
	    title += ' <small>' + subtitle + '</small>';
	}

	$('#title').html(
			 '<div class="page-header">' +
			 '<h3 id="inner-title">' + title + '</h3>' +
			 '</div>'
			 );
    };

    window.humanizeDay = function(day) {
	return Date.parse(day).toString('dddd, MMM d');
    };

    window.Today = function() {
	return Date.today().toString('yyyy-MM-dd');
    };

    window.getCurrentDay = function() {
	fragment = Backbone.history.fragment;
	match = fragment.match(/\d{4}-\d{2}-\d{2}/);
	if (match) {
	    currentDay = match[0];
	} else {
	    currentDay = Today();
	}

	return currentDay;
    }

    window.Group = Backbone.Model.extend({
	    urlRoot: '/groups'
	});
    window.GroupsList = Backbone.Collection.extend({
	    model: Group,
	    url: '/groups'
	});
    window.Groups = new GroupsList;

    window.Team = Backbone.Model.extend({
	    urlRoot: '/teams'
	});
    window.TeamsList = Backbone.Collection.extend({
	    model: Team,
	    url: '/teams'
	});
    window.Teams = new TeamsList;

    window.Snip = Backbone.Model.extend({
	    urlRoot: '/snips'
	});
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

    Backbone.View.prototype.close = function(){
	this.remove();
	this.unbind();
	if (this.onClose){
	    this.onClose();
	}
    }

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

    window.EditSnipView = Backbone.View.extend({
	    template: _.template(
				 '<form class="form-horizontal" onsubmit="return false;">' +
				 '<fieldset>' +
				 '<div class="row">' +
				 '<div class="span8">' +
				 '<div class="control-group">' +
				 '<label class="control-label" for="textarea"><%= team.name %></label>' +
				 '<div class="controls">' +
				 '<textarea style="width: 100%" rows="4" placeholder="What did you do on this day?"><%= model.get("content") %></textarea>' +
				 '</div>' +
				 '</div>' +
				 "<button class='btn save-snippet pull-right'>Save</button>" +
				 '<span class="label label-info pull-right" style="margin-right: 6px">Unchanged</span>' +
				 '</div>' +
				 '</div>' +
				 '</fieldset>' +
				 '</form>'
				 ),

	    events: {
		"click .save-snippet": "saveSnippet",
		"keyup textarea": "setStatus"
	    },

	    initialize: function(data) {
		_.bindAll(this, "saveSnippet", "setStatus", "render");

		this.model = data.snip;
		this.team = data.team;
	    },

	    render: function() {
		$(this.el).html(this.template({model: this.model, team: this.team}));
		return this;
	    },

	    saveSnippet: function(event) {
		var content = $.trim(this.$('textarea').val());
		var $label = this.$('.label');
		$label.html("Saving...");

		var attrs = {content: content};
		this.model.save(attrs, {
			success: function(model, response) {
			    $label.removeClass("label-info");
			    $label.removeClass("label-important");
			    $label.addClass("label-success");
			    $label.html("Saved");
			},
			error: function(model, response) {
			    $label.removeClass("label-info");
			    $label.removeClass("label-success");
			    $label.addClass("label-important");
			    $label.html("Error");
			},
		    });
	    },

	    setStatus: function(event) {
		var $label = this.$('.label');
		$label.removeClass("label-info label-success");
		$label.addClass("label-warning");
		$label.html("Unsaved");
	    }
	});

    window.MeView = Backbone.View.extend({
	    template: _.template(
				 '<div class="row">' +
				 '<div id="edit-snips" class="span8 offset2 well">' +
				 '</div>' +
				 '</div>'
				 ),

	    initialize: function(day) {
		this.day = day;

		_.bindAll(this, "loadSnippets", "render", "onClose");

		UserSnips.on("reset", this.loadSnippets);
		UserSnips.fetch({data: {user_id: CurrentUser.id, day: this.day}});
	    },

	    render: function() {
		setTitle(CurrentUser.get('nickname'), humanizeDay(this.day));

		$(this.el).html(this.template());

		return this;
	    },

	    loadSnippets: function() {
		var teams = CurrentUser.get("teams");
		for (var i = 0; i < teams.length; i++) {
		    var team = teams[i];

		    var snips = UserSnips.where({team_id: team.id});
		    var snip;
		    if (snips.length > 0) {
			snip = snips[0];
		    } else {
			attrs = {
			    user_id: CurrentUser.id,
			    day: getCurrentDay(),
			    team_id: team.id
			};
			snip = new Snip(attrs);
		    }

		    var editView = new EditSnipView({snip: snip, team: team}).render().el;
		    $('#edit-snips').append(editView);
		}
	    },

	    onClose: function() {
		UserSnips.off("reset", this.loadSnippets);
	    }
	});

    window.SnipsView = Backbone.View.extend({
	    initialize: function() {
		_.bindAll(this, "addOne", "addAll", "render", "onClose");

		$(this.el).html('<div><ul id="snips-list"></ul></div>');
	    },

	    render: function() {
		//alert("SnipsView#render");

		Snips.on("reset", this.addAll);
		Snips.fetch();

		return this;
	    },

	    addOne: function(snip) {
		var view = new SnipView({model: snip}).render().el;
		this.$('#snips-list').append(view);
	    },

	    addAll: function() {
		Snips.each(this.addOne);
	    },

	    onClose: function() {
		Snips.off("reset", this.addAll);
	    }
	});

    window.GroupView = Backbone.View.extend({
	    initialize: function(groupId, day) {
		this.groupId = groupId;
		this.day = day;

		_.bindAll(this, "addOne", "addAll", "render", "onClose");
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

		// Total hack
		var group = new Group({id: this.groupId, day: this.day});
		group.fetch({
			success: function(model, response) {
			    setTitle(model.get("name"), humanizeDay(model.get('day')));
			}});

		GroupSnips.on("reset", this.addAll);
		GroupSnips.fetch({data: {group_id: this.groupId, day: this.day}});

		return this;
	    },

	    addOne: function(snip) {
		var view = new SnipView({model: snip}).render().el;
		this.$('#group-snips-list').append(view);
	    },

	    addAll: function() {
		// Hack to only add once until I figure out why two GroupViews get initialized.
		if ($('#group-snips-list > div').size() == 0) {
		    if (GroupSnips.length > 0) {
			GroupSnips.each(this.addOne);
		    }
		    else {
			this.$('#group-snips-list').append($('<div>No Snips</div>'));
		    }
		}
	    },

	    onClose: function() {
		GroupSnips.off("reset", this.addAll);
	    }
	});

    window.TeamView = Backbone.View.extend({
	    initialize: function(teamId, day) {
		this.teamId = teamId;
		this.day = day;

		_.bindAll(this, "addOne", "addAll", "render", "onClose");
	    },

	    template: _.template(
				 '<div class="row">' +
				 '<div class="span8 offset2 well">' +
				 '<div><ul id="team-snips-list"></ul></div>' +
				 '</div>' +
				 '</div>'
				 ),

	    render: function() {
		this.$el.html(this.template());

		// Total hack
		var team = new Team({id: this.teamId, day: this.day});
		team.fetch({
			success: function(model, response) {
			    setTitle(model.get("name"), humanizeDay(model.get('day')));
			}});

		TeamSnips.on("reset", this.addAll);
		TeamSnips.fetch({data: {team_id: this.teamId, day: this.day}});

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

	    onClose: function() {
		TeamSnips.off("reset", this.addAll);
	    }
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
		_.bindAll(this, "signIn", "render", "onClose");

		Users.on("reset", this.render);
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
	    },

	    onClose: function() {
		Users.off("reset", this.render);
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
				 '<h3>Teams</h3> <ul id="teams" class="nav nav-pills"></ul>' +
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
				 '<li><button class="btn btn-info" data-toggle="modal" data-target="#info-modal"><i class="icon-info-sign icon-white"></i> Info</button></li>' +
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
				 '<p><strong>e</strong> - Edit ( if available )</p>' +
				 '<p><strong>j</strong> - Previous day</p>' +
				 '<p><strong>k</strong> - Next day</p>' +
				 '<p><strong>t</strong> - Today</p>' +
				 '<p><strong>i</strong> - Your view</p>' +
				 '<p><strong>l</strong> - List view</p>' +
				 '<p><strong>esc</strong> - Blur ( take focus away from current element )</p>' +
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
		_.bindAll(this, "loadGroups", "loadTeams", "next", "previous", "replaceView", "signOut", "render", "onClose");

		this.render();

		key('e', function(event) {
			event.preventDefault();
			$('textarea').first().focus();
		    });
		key('i', function() {
			fragment = "me/" + getCurrentDay();
			Backbone.history.navigate(fragment, {trigger: true});
		    });
		key('l', function() {
			fragment = "group/1/" + getCurrentDay();
			Backbone.history.navigate(fragment, {trigger: true});
		    });
		key('j', function() {
			SnipsAppView.previous();
		    });
		key('k', function() {
			SnipsAppView.next();
		    });
		key('t', function() {
			SnipsAppView.today();
		    });
	    },

	    render: function() {
		var date = Today();
		$(this.el).html(this.template({date: date, user: CurrentUser}));

		Groups.on("reset", this.loadGroups);
		Groups.fetch();

		Teams.on("reset", this.loadTeams);
		Teams.fetch();
	    },

	    loadGroups: function(event) {
		Groups.each(function(group) {
			$('#groups').append($('<li><a href="#group/' + group.id + '">' + group.get('name') + '</a></li>'));
		    });
	    },

	    loadTeams: function(event) {
		Teams.each(function(team) {
			$('#teams').append($('<li><a href="#team/' + team.id + '">' + team.get('name') + '</a></li>'));
		    });
	    },

	    navigate: function(event) {
		var location = $(event.currentTarget).attr('data-location');
		location = location + "/" + getCurrentDay();

		Backbone.history.navigate(location, {trigger: true});
	    },

	    replaceView: function(newView) {
		if (this.currentView) {
		    this.currentView.close();
		}

		this.currentView = newView;
		this.currentView.render();

		$('#content').html(this.currentView.el);
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
		this.$el.html('');
		this.unbind();
		Groups.off("reset", this.loadGroups);
		Teams.off("reset", this.loadTeams);
		new LoginView;
	    },

	    today: function() {
		fragment = Backbone.history.fragment;
		match = fragment.match(/\d{4}-\d{2}-\d{2}/);
		if (match) {
		    hasDate = true;
		} else {
		    hasDate = false;
		}

		day = Today();

		var location = '';
		if (hasDate) {
		    location = fragment.replace(match[0], day);
		} else {
		    location = fragment + "/" + day;
		}

		Backbone.history.navigate(location, {trigger: true});
	    },

	    onClose: function() {
		Groups.off("reset", this.loadGroups);
		Teams.off("reset", this.loadTeams);
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
		Backbone.history.navigate("group/1/" + Today(), {trigger: true});
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
