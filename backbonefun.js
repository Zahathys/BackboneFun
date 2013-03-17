$(function(){

	// Models
	//--------
	var Airline = Backbone.Model.extend({
		name: null,
		secondary_name: null,
		bts_code: null,
		iata_code: null,
		icao_code:null
	});

	var AirlineList = Backbone.Collection.extend({
		model: Airline
	});
	
	var TableOptions = Backbone.Model.extend({
		currentPage: null,
		pageSize: null
	});
	
	// Views
	//--------
	var AirlineListView = Backbone.View.extend({
		el: $('#airlines'),
		
		template_pageSize: _.template($('#pageSize-template').html()),
		
		events: {
			"click #prev"   : "previous",
			"click #next"  	: "next",
			"blur #page"    : "changePageSize"
		},
	
		initialize: function () {
			this.render();
			this.viewList = new Array();
		},
		
		refreshAirlines: function () {
			this.$el.find("tr").not("#header").not("#footer").empty();
			$.each(this.viewList, function(index, element) {
				element.remove();
			});
			
			var startIndex = (this.model.get("currentPage") - 1) * this.model.get("pageSize");
			for (var i = startIndex; i < startIndex + this.model.get("pageSize"); i++) {
				if(i < this.collection.length){
					var view = new AirlineView({model: this.collection.at(i)});
					this.$el.find("#footer").before(view.render().el);
					this.viewList[i] = view;
				}
			}
		},
		
		render: function () {
			this.$el.find('#pageSizeFooter').html(this.template_pageSize(this.model.toJSON()));
			this.pageSizeInput = this.$('#page');
		},
		
		previous: function() {
			if(this.model.get("currentPage") > 1){
				this.model.set({currentPage: this.model.get("currentPage") - 1});
				this.refreshAirlines();
			}
		},
		
		next: function() {
			if(this.model.get("currentPage") < Math.floor(this.collection.length / this.model.get("pageSize")) + 1){
				this.model.set({currentPage: this.model.get("currentPage") + 1});
				this.refreshAirlines();
			}
		},
		
		changeSelection: function(clickedView) {
			if(this.currentSelection && this.currentSelection != null)
			{
				this.currentSelection.$el.removeClass("selectedItem");
				if(this.currentSelection == clickedView)
				{
					airlineEditView.emptyIt();
					this.currentSelection = null;
				} else {
					this.currentSelection = clickedView;
					this.currentSelection.$el.addClass("selectedItem");
				}
			} else
			{
				this.currentSelection = clickedView;
				this.currentSelection.$el.addClass("selectedItem");
			}
		},
		
		addOne: function(airline) {
			this.model.set({currentPage: Math.floor(this.collection.length / this.model.get("pageSize")) + 1});
			this.refreshAirlines();
		},
		
		changePageSize: function() {
			var size = parseInt(this.pageSizeInput.val());
			this.model.set({currentPage: 1, pageSize: size});
			this.refreshAirlines();
		}
	});
	
	var AirlineView = Backbone.View.extend({
		tagName: "tr",
		
		template: _.template($('#airline-template').html()),
		
		events: {
			"click"   : "changeEdit",
		},
	
		initialize: function () {
			this.listenTo(this.model, 'change', this.render);
		},
		
		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		
		changeEdit: function() {
			airlineEditView.changeAirline(this.model);
			appview.changeSelection(this);
		}
	});
	
	var AirlineEditView = Backbone.View.extend({
		el: $('#edit-airline'),
		
		template: _.template($('#edit-airline-template').html()),
		template_empty: _.template($('#edit-airline-template-empty').html()),
		
		events: {
			'keyup :input': 'save'
	    },
		
		render: function () {
			if(this.model != null){
				this.$el.find('#edit-airline-form').removeClass("no-selection");
				this.$el.find('#edit-airline-form').addClass("selection-edit");
				this.$el.find('#edit-airline-form').html(this.template(this.model.toJSON()));
				this.btsinput = this.$('#bts');
				this.iatainput = this.$('#iata');
				this.icaoinput = this.$('#icao');
			} else {
				this.$el.find('#edit-airline-form').addClass("no-selection");
				this.$el.find('#edit-airline-form').removeClass("selection-edit");
				this.$el.find('#edit-airline-form').html(this.template_empty());
			}
			return this;
		},
		
		changeAirline: function(airline) {
			this.model = airline;
			this.render();
		},
		
		save: function() {
			var bts = this.btsinput.val();
			var iata = this.iatainput.val();
			var icao = this.icaoinput.val();
			this.model.set({bts_code: bts, iata_code: iata, icao_code: icao});
		},
		
		emptyIt: function() {
			this.model = null;
			this.render();
		}
	});
	
	var AirlineAddView = Backbone.View.extend({
		el: $('#add-airline'),
		
		template: _.template($('#add-airline-template').html()),
		
		events: {
			'click button': 'addAirline'
	    },
  
		initialize: function () {
			this.newModel();
			this.render();
		},

		newModel: function () {
			this.model = new Airline({name: '', bts_code: '', iata_code: '', icao_code: ''});
		},
		
		render: function () {
			this.$el.find('#add-airline-form').html(this.template(this.model.toJSON()));
			this.nameinput = this.$('#name');
			this.btsinput = this.$('#bts_add');
			this.iatainput = this.$('#iata_add');
			this.icaoinput = this.$('#icao_add');
		},
		
		addAirline: function () {
			var name = this.nameinput.val();
			var bts = this.btsinput.val();
			var iata = this.iatainput.val();
			var icao = this.icaoinput.val();
			this.model.set({name: name, bts_code: bts, iata_code: iata, icao_code: icao});
			Airlines.add(this.model);
			this.newModel();
			this.render();
		}
	});
	
	// Start application
	//--------------------
	var Airlines = new AirlineList;
	var airlineEditView = new AirlineEditView();
	var airlineAddView = new AirlineAddView();
	var tableOptions = new TableOptions({currentPage: 1,pageSize: 15});
	var appview = new AirlineListView({collection: Airlines, model: tableOptions});
	
	$.getJSON('Airline.json', function(data) {
		$.each(data, function(index, element) {
			Airlines.add(element);
		});
		appview.refreshAirlines();
		appview.listenTo(Airlines, 'add', appview.addOne);
	});
	
});