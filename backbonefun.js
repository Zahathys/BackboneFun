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
			airlineEditView.emptyIt();
			
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
			this.$el.draggable({ revert: true, helper: "clone" });
			this.$el.data("backbone-view", this);
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
	
	var MyAirlineView = Backbone.View.extend({
		el: $('#my-airlines'),
		
		template: _.template($('#my-airline-template').html()),
		template_empty: _.template($('#my-airline-template-empty').html()),
  
		initialize: function () {
			this.render();
			this.modelList = new Array();
		},
		
		events: {
			'click #toPdf': 'toPdf'
	    },
		
		render: function () {
			this.$el.find('#my-airline-form').html(this.template_empty());
			this.$el.find('#my-airline-form').addClass("no-airlines");
			this.$el.droppable({
				drop: function( event, ui ) {
					var model = $(ui.draggable).data("backbone-view").model;
					myAirlinesView.addAirline(model);
				}
			});
		},
		
		addAirline: function (model) {
			if(!this.alreadyCalled){
				this.$el.find('#my-airline-form').removeClass("no-airlines");
				this.$el.find('#my-airline-form').empty();
				this.alreadyCalled = true;
			}
			this.$el.find('#my-airline-form').append(this.template(model.toJSON()));
			this.modelList.push(model);
		},
		
		toPdf: function () {
			var doc = new jsPDF();
			
			doc.setTextColor(66, 66, 99);
			doc.setFontType("bold");
			doc.setFontSize(32);
			doc.text(10, 20, "List of selected airlines");
			
			doc.setTextColor(66, 66, 99);
			doc.setFontType("normal");
			doc.setFontSize(21);
			doc.setLineWidth(1);
			doc.setDrawColor(66, 66, 99);
			doc.setFillColor(66, 66, 99);
			var i = 40;
			$.each(this.modelList, function(index, element) {
				var bts_code = element.get("bts_code");
				var iata_code = element.get("iata_code");
				var icao_code = element.get("icao_code");
				var code = (bts_code == null ? (iata_code == null ? (icao_code == null ? '' : icao_code) : iata_code) : bts_code)
			
				doc.circle(15, i-2, 1, 'FD');
				doc.text(20, i, element.get("name") + " - " + code);
				i = i + 10;
			});
			
			doc.output('datauri');
		}
		
	});
	
	// Start application
	//--------------------
	var Airlines = new AirlineList;
	var MyAirlines = new AirlineList;
	var airlineEditView = new AirlineEditView();
	var airlineAddView = new AirlineAddView();
	var myAirlinesView = new MyAirlineView();
	var tableOptions = new TableOptions({currentPage: 1,pageSize: 15});
	var appview = new AirlineListView({collection: Airlines, model: tableOptions});
	
	$.getJSON('data/Airline.json', function(data) {
		$.each(data, function(index, element) {
			Airlines.add(element);
		});
		appview.refreshAirlines();
		appview.listenTo(Airlines, 'add', appview.addOne);
	});
	
});