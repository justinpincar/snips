$(function() {
    window.Snip = Backbone.Model.extend({});
    window.SnipsList = Backbone.Collection.extend({
	    model: Snip,
	    localStorage: new Backbone.LocalStorage("Snips")

	});
    window.Snips = new SnipsList;

    window.User = Backbone.Model.extend({});
    window.UsersList = Backbone.Collection.extend({
	    model: User
	});
    window.Users = new UsersList;

    window.SnipView = Backbone.View.extend({
	    tagName: "li",
	    className: "snip",

	    template: _.template(
				 "<span><%= model.get('user') %></span>" +
				 "<input type='text' class='snip-text' value='<%- model.get('content') %>' />" +
				 "<button class='snip-save'>Save</button>" +
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
				 "<div>ENG:</div><textarea id='ENG-snippet' class='snippet-content'></textarea>" +
				 "<button class='save-snippet' data-team='ENG'>Save</button>"
				 ),

	    events: {
		"click .save-snippet": "saveSnippet"
	    },

	    initialize: function() {
		_.bindAll(this, "saveSnippet", "render");
		this.render();
	    },

	    render: function() {
		$(this.el).html(this.template());
		$('#content').html(this.el);
		return this;
	    },

	    saveSnippet: function(event) {
		var team = $(event.currentTarget).attr('data-team');
		Snips.create({
			user: $.cookie("user"),
			    content: this.$('#' + team + '-snippet').val(),
			    day: Date.today().toString('yyyy-MM-dd'),
			    team: team
			    });

	    }
	});

    window.SnipsView = Backbone.View.extend({
	    initialize: function() {
		_.bindAll(this, "addOne", "addAll", "render");

		Snips.bind("add", this.addOne);
 		Snips.bind("reset", this.addAll);
		Snips.bind("all", this.render);

		$('#content').html('');
		$(this.el).html('<div id="snips"><ul id="snips-list"></ul></div>');

		Snips.fetch();
	    },

	    render: function() {
		//alert("SnipsView#render");
		$('#content').html(this.el);
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

    window.LoginView = Backbone.View.extend({
	    el: '#snips-app',

	    template: _.template(
				 "<h3>Sign In</h3>" +
				 "<% _.each(users, function(user) { %><div class='user' data-user='<%= user %>'><%= user %></div><% }) %>"
				 ),

	    events: {
		"click .user": "signIn"
	    },

	    initialize: function() {
		_.bindAll(this, "signIn", "render");
		Users.fetch();
		this.render();
	    },

	    render: function() {
		this.$el.html(this.template({users: Users}));
		return this;
	    },

	    signIn: function(event) {
		var user = $(event.currentTarget).attr('data-user');
		$.cookie("user", user, {expires: 7});
		window.SnipsAppView = new AppView;
		Backbone.history.start();
	    }
	});

    window.AppView = Backbone.View.extend({
	    el: '#snips-app',

	    template: _.template('<div id="sign-out">Sign Out</div><div class="navigate" data-location="me"><%= user %></div><div class="navigate" data-location="list">List</div><div>Today: <%= date %></div><br /><br /><div id="content"></div>'),

	    events: {
		"click #sign-out": "signOut",
		"click .navigate": "navigate"
	    },

	    initialize: function() {
		_.bindAll(this, "replaceView", "signOut", "render");

		this.currentView;
		this.render();

		key('i', function() {
			Backbone.history.navigate("me", {trigger: true});
		    });
		key('l', function() {
			Backbone.history.navigate("list", {trigger: true});
		    });
	    },

	    render: function() {
		var date = Date.today().toString('yyyy-MM-dd');
		var user = $.cookie("user");
		$(this.el).html(this.template({date: date, user: user}));
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

	    signOut: function() {
		$.cookie("user", null);
		location = '/';
	    }
	});

    window.Router = Backbone.Router.extend({
	    routes: {
		"list": "list",
		"me": "me",
		"*splat": "list"
	    },

	    list: function() {
		SnipsAppView.replaceView(new SnipsView);
	    },

	    me: function() {
		SnipsAppView.replaceView(new MeView);
	    }
	});

    new Router;
    var user = $.cookie("user");
    if (user) {
	window.SnipsAppView = new AppView;
	Backbone.history.start();
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
