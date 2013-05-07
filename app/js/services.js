'use strict';

/* Services */


angular.module('courseSearchApp.services', ['ngResource'])

.factory('Facet', function($resource) {
	return $resource('https://test.uisapp2.iu.edu/sissrarm-unt/arm-ks/myplan/course/facetValues?campusParam=edu.iu.sis.acadorg.SisInstitution.IUBLA,edu.iu.sis.acadorg.SisInstitution.IUINA&termParam=any&queryText=math&casticket=ST-1703-rxcPemOBOpacKT9oiooY-casstg02.uits.iu.edu', {}, {
		query:{ method:'GET', isArray:false }
	});
})

.factory('searchFactory', function($http) {
	
	var SearchFactory = function() {

	};
	SearchFactory.prototype = {
		query: null,
		placeholder: '',
		examples: null,
		criteria: null,
		filters: null,
		count: 0,
		resultsPerPage: 20,
		
		get numberOfPages() {
			return Math.ceil(this.count / this.resultsPerPage);
		},
		
		config: function(properties) {
			// Apply all properties from the source object
			for( var key in properties )
				this[key] = properties[key];
		},
		
		search: function(params) {
			var self = this;

			$http.get('/sissrarm-cs-kart/myplan/course/s/json', { params: params })
			.success(function(data, status) {

				if( data.results && data.count ) {
					// Transform results
					for( var i = 0, n = data.results.length; i < n; i++ ) {
						var r = data.results[i];
						r.result.index = r.index;
						
						// Translate the result into a course model	
						var course = new Course(r.result, data);
						
						// Reassign
						data.results[i] = course;
						
						// Load the course into cache, indexed by index and unique id
						//$scope.resultsCache[course.index] = course;
						//$scope.resultsCache[course.slug] = course;
					}
				}

				self.config(data);
				
				//if( angular.isDefined(successCallback) )
				//	successCallback();
	
				//console.log('woot', factory, status);
			})
			.error(function(data, status, headers, config) {
				console.log(data, status, headers, config);
			});
		}
	};
	
	var factory = new SearchFactory();
	factory.search();
		
	var Course = function(config, context) {
		// Apply all properties from the source object
		for( var key in config )
			this[key] = config[key];
		
		this.context = context;
		
		// Need min credits, not max
		if( !this.credits.value )
			this.credits.value = this.credits.max;
		
		this.offering = [
			{
				year: 2013,
				term: 'Fall',
				offering: getRandomInt(0,2)
			},
			{
				year: 2014,
				term: 'Spring',
				offering: getRandomInt(0,2)
			},
			{
				year: 2014,
				term: 'Summer',
				offering: getRandomInt(0,2)
			}
		];
		
		// Retain restore
		this._bookmark = this.bookmark;
		
		return this;
	};
	Course.prototype = {
	
		get desc() {
			return this.description ? this.description : this.bulletinDescription;
		},
		
		get bookmarked() {
			return this.bookmark != null;
		},
		
		set bookmarked(val) {
			if( val ) { // Bookmark and save restore
				this.bookmark = this._bookmark = Date.now();
				this.bookmarkAddedAnimation();
			}
			else { // Undo bookmark but retain restore
				this.bookmark = null;
				this.bookmarkRemovedAnimation();
			}
		},
		
		restoreBookmark: function() {
			this.bookmark = this._bookmark;
			this.bookmarkAddedAnimation();
		},
		
		bookmarkAddedAnimation: function() {
			$scope.bookmarkAdded = true;
			$timeout(function() { // Remove animation class after the animation completes
				$scope.bookmarkAdded = false;
			}, 250);
		},
		
		bookmarkRemovedAnimation: function() {
			$scope.bookmarkRemoved = true;
			$timeout(function() { // Remove animation class after the animation completes
				$scope.bookmarkRemoved = false;
			}, 500);
		},
		
		get next() {
			return $scope.resultsCache[this.index + 1] || null;
		},
		
		get prev() { // Can't use `previous()`, for whatever reason.
			return this.index == 0 ? null : ($scope.resultsCache[this.index - 1] || null);
		},
		
		get url() {
			return ['#/search', this.context.criteria.key, this.context.query, this.slug].join('/');
		}
	};

	/*
	$scope.searchCourses = function(page, transition, successCallback) {
		page = page ? page : 1;
		transition = transition ? transition : true;

		if( validate() && $scope.searchModel.query.length ) {

			// If query or facets changed since last call, clear page and result cache
			if( $scope.searchModel.query != $scope.search.query ) {
				$scope.resultsCache = [];
				$scope.pageCache = [];
				$scope.results = [];
			}
			
			var criteriaIds = ids(selectedFacets($scope.search.criteria.facets));
			var filterIds = ids(selectedFacets($scope.search.filters.facets));
			var facetIds = criteriaIds.concat(filterIds);
			
			var params = {
				query: $scope.searchModel.query,
				length: 2 * $scope.resultsPerPage,
				start: (page - 1) * $scope.resultsPerPage,
				facet: facetIds };
			
			searchQueryService(params, function() {
				if( transition ) {
					var p = { criteriaKey: $scope.search.criteria.key, query: $scope.search.query, page: page };
					$state.transitionTo('course.search.results.list', p);
				}
			});
		}
	};
	*/
	return factory;
})

.factory('searchService', function($http) {

	var k = 0;
	
	// Higher `chance`, fewer random items
	var convert = function(obj, chance) {
		chance = chance ? chance : 0;
		var a = [];
		for( var key in obj ) {
			a.push({
				id: (++k).toString(),
				label: key,
				count: obj[key].count,
				value: chance ? getRandomInt(0, chance) == 0 : obj[key].checked
			});
		}
		return a;
	};
	
	var labelize = function(arr) {
		var a = [];
		for( var i = 0, n = arr.length; i < n; i++, ++k ) {
			a.push({ label: arr[i], value: false, id: k.toString() });
		}
		return a;
	};
	
	var campuses = labelize([
		'IU Bloomington', // id: 0
		'IUPUI Indianapolis', // id: 1
		'IUPUC Columbus',
		'IU East',
		'IPFW Fort Wayne',
		'IU Kokomo',
		'IU Northwest',
		'IU South Bend',
		'IU Southeast'
	]);
	
	campuses[0].value = true;
	
	var degrees = labelize([
		'Undergraduate',
		'Graduate', // id: 10
		'Professional'
	]);
	
	degrees[0].value = true;
	degrees[2].condition = "0||1"; // BL or IUPUI
	
	var scheduledTerms = labelize([
		'Spring 2013',
		'Summer 2013',
		'Fall 2013',
		'Winter 2013'
	]);
	
	// (BL & Grad) or (IUPUI & Grad)
	// "(0&10)|(1&10)"
	// Grad & (BL or IUPUI)
	// "10&(0|1)"
	scheduledTerms[3].condition = "10&&(0||1)";
	
	var projectedTerms = labelize([
		'Fall',
		'Spring',
		'Summer'
	]);
	
	// Until AngularJS supports comment repeaters,
	// `facets` and `groups` must be separated,
	// instead of smartly deriving object types.
	// Not sufficient flexibility, unfortunately.
	var searchCriteria = [
		{
			label: 'Campus',
			select: true, // Only one facet may be selected
			facets: [
				{ label: 'Campuses', facets: campuses },
				{ facets: labelize(['Online']) }
			]
		},
		{
			label: 'Degree Level',
			alerts: [ { type: 'error', message: 'Select a degree level.', condition: "!(9||10||11)" } ],
			facets: degrees
		},
		{
			label: 'Offered',
			alerts: [ { type: 'error', message: 'Select a term.', condition: "!any&&!(12||13||14||15||16||17||18)" } ],
			radio: true, // Only one facet may be selected
			facets: [
			  	{ label: 'Any term', id: 'any', value: true },
				{
					label: 'Specific term',
					id: '',
					value: false,
					facets: [
						{ label: 'Scheduled classes', facets: scheduledTerms },
						{ label: 'All courses', title: 'including scheduled classes', facets: projectedTerms }
					]
				}
			]
		},
		{
			facets: [ { label: 'More than 10 years ago', id: (++k).toString() } ]
		}
	];

	var searchExamples = [
		{ label: 'Find english courses', examples: [ 'english', 'ENG', 'ENG-W' ] },
		{ label: 'Find a specific english course', examples: [ 'ENG-W 131' ] },
		{ label: 'Find 200-level english courses', examples: [ 'ENG 2*' ] }
	];
	
	var search = {
		
		query: null,
		placeholder: 'title, keyword, department, subject, or number',
		examples: searchExamples,
		criteria: {
			key: 'z6xx52',
			facets: searchCriteria }
		
	};

	$http.get('json/facetValues.json').success(function(data) {
		//search.query = data.sQuery;
		
		var facetGroups = [
			//{ label: 'Campus', facets: convert(data.oFacetState.facet_campus) },
			//{ label: 'Terms', facets: convert(data.oFacetState.facet_terms, 2) },
			{ label: 'Gen Ed', facets: convert(data.oFacetState.facet_gened, 1) },
			{ label: 'Credits', facets: convert(data.oFacetState.facet_credits, 10) },
			{ label: 'Class Level', facets: convert(data.oFacetState.facet_level, 4) },
			{ label: 'Subject', facets: convert(data.oFacetState.facet_subject, 8) },
			{ label: 'Keywords', facets: convert(data.oFacetState.facet_keywords, 8) }
		];
		
		search.filters = { facets: facetGroups };
	});
	
	return search;

})

.value('version', '0.1');
