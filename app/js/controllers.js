'use strict';

/* Controllers */

function CourseSearchCtrl($scope, $routeParams, $http, $dialog, $timeout) {
	
	// Higher `chance`, fewer random items
	var convert = function(obj, chance) {
		chance = chance ? chance : 0;
		var a = [];
		for( var key in obj ) {
			a.push({
				label: key,
				count: obj[key].count,
				value: chance ? getRandomInt(0, chance) == 0 : obj[key].checked
			});
		}
		return a;
	};
	
	var k = 0;
	
	var labelize = function(arr) {
		var a = [];
		for( var i = 0, n = arr.length; i < n; i++, ++k ) {
			a.push({ label: arr[i], value: false, id: k });
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
	var searchFacets = [
		{
			label: 'Campus',
			selected: 0, // facet id
			facets: [
				{ label: 'Campuses', facets: campuses },
				{ label: ' ', facets: labelize(['Online']) }
			]
		},
		{
			label: 'Degree Level',
			alerts: [ { type: 'error', message: 'Select a degree level.', condition: "!(9||10||11)" } ],
			facets: degrees
		},
		{
			label: 'Offered',
			alerts: [ { type: 'error', message: 'Select a term.', condition: "!21&&!(12||13||14||15||16||17||18)" } ],
			facets: [
				{ id: (++k),
				  value: true,
				  open: false, // Show child facets when the facet value equals the open value
				  radio: [
					{ label: 'Any term', value: 1 },
					{ label: 'Specific term', value: 0 } ],
				  facets: [
					{ label: 'Scheduled classes', facets: scheduledTerms },
					{ label: 'All courses', small: '(including scheduled classes)', facets: projectedTerms }
				] }
					
			]
		},
		{
			facets: [ { label: 'More than 10 years ago', id: (++k) } ]
		}
	];
	
	var searchExamples = [
		{ label: 'Find english courses', examples: [ 'english', 'ENG', 'ENG-W' ] },
		{ label: 'Find a specific english course', examples: [ 'ENG-W 131' ] },
		{ label: 'Find 200-level english courses', examples: [ 'ENG 2*' ] }
	];
	
	$scope.search = {
		
		query: '',
		placeholder: 'title, keyword, department, subject, or number',
		examples: searchExamples,
		facets: searchFacets
		
	};
	
	var selectedFacetIds = function(source, arr) {
	
		// Generate an array, if one is not provided
		if( !angular.isArray(arr) )
			arr = [];
			
		// Loop through facets
		for( var i = 0, n = source.length; i < n; i++ ) {
			var facet = source[i];
			
			// Add the <select> id, if available
			if( angular.isDefined(facet.selected) )
				arr.push(facet.selected);
				
			// Or add this facet's id if checked
			else if( angular.isDefined(facet.id) && facet.value == true )
				arr.push(facet.id);
				
			// Recursively find child facet ids
			if( angular.isArray(facet.facets) )
				selectedFacetIds(facet.facets, arr);
		}
		
		return arr;
	};
	
	var checkCondition = function(condition, ids) {

		// Converts something like this:
		// "10&&(0||1)" => "false&&(true||false)" => false
		
		// Split the string, matching ids
		var conditional = condition.split(/(\d+)/g);
		
		// Process ids
		for( var i = 0, n = conditional.length; i < n; i++) {
			var a = conditional[i];
			
			// Ignore empty, non-numeric strings
			if( a.length > 0 && !isNaN(a) )
				// Replace with a bool indicating a match in the source ids
				conditional[i] = ids.indexOf(Number(a)) != -1;
		}
		
		// Rejoin
		conditional = conditional.join('');

		return $scope.$eval(conditional);
	};
	
	var checkFacets = function(source, ids, value) {
	
		// Determine the default facet source, if not supplied
		if( !angular.isArray(source) )
			source = $scope.search.facets;
	
		// Determine the selected facet ids, if not supplied
		if( !angular.isArray(ids) )
			ids = selectedFacetIds($scope.search.facets);
	
		for( var i = 0, n = source.length; i < n; i++ ) {
			var facet = source[i];
			
			// Conditionally determine to show a facet
			if( angular.isString(facet.condition) ) {
				if( checkCondition(facet.condition, ids) )
					delete facet.exclude;
				else {
					facet.exclude = true;
					facet.value = false; // Reset value when excluded
				}		
			}
			
			// Override value, if one is provided
			if( angular.isDefined(facet.value) && angular.isDefined(value) )
				facet.value = value;
			
			// Cascade values only down, not across sibling facets.
			// Clear child facet values once they hide.
			var childValues = angular.isDefined(value) ? value : ( angular.isDefined(facet.open) && facet.value != facet.open ? false : undefined );

			// Recursively check all child facets
			if( angular.isArray(facet.facets) )
				checkFacets(facet.facets, ids, childValues);
		}
	};
	
	var _validate = function(source, ids) {
	
		// Determine the default facet source, if not supplied
		if( !angular.isArray(source) )
			source = $scope.search.facets;
	
		// Determine the selected facet ids, if not supplied
		if( !angular.isArray(ids) )
			ids = selectedFacetIds($scope.search.facets);
		
		// Assume valid, until proven otherwise
		var valid = true;
		
		for( var i = 0, n = source.length; i < n; i++ ) {
			var facet = source[i];
			
			// Only bother if a conditional is provided
			
			if( angular.isArray(facet.alerts) ) {
				
				for( var j = 0, m = facet.alerts.length; j < m; j++ ) {
					var alert = facet.alerts[j];
					
					if( angular.isString(alert.condition) ) {
						var condition = checkCondition(alert.condition, ids);
						alert.show = condition; // If error is found
						valid &= !condition; // Globally determine if there are any errors
					}
				}
			}
			
			/*
			if( angular.isDefined(facet.error) && angular.isString(facet.error.condition) ) {
				var condition = checkCondition(facet.error.condition, ids);
				facet.error.show = condition; // If error is found
				valid &= !condition; // Globally determine if there are any errors
			}
*/
			// Recursively check all child facets
			if( angular.isArray(facet.facets) )
				valid &= _validate(facet.facets, ids);
		}
		
		return valid;
	};
	
	var valid = true;
	
	var validate = function() {
		valid = _validate();
	};
	
	$scope.searchCourses = function() {
		validate();
	};
	
	$scope.checkFacets = function() {
		// When facet updates with errors, recheck validation
		if( !valid )
			validate();
		checkFacets();
	};
	
	// Check facets, based on supplied defaults
	$scope.checkFacets();
	
	// Because ng-repeat creates a new scope,
	// we have to access the query property via a function, not inline
	$scope.applySearchExample = function(example) {
		$scope.search.query = example;
	};
	
	// Flattens the source facet array to prepare for <select>'s ng-option
	$scope.selectize = function(source) {
		var array = [];
		for( var i = 0, n = source.length; i < n; i++ ) {
			var a = source[i];
			for( var j = 0, m = a.facets.length; j < m; j++ ) {
				var b = a.facets[j];
				b.group = a.label;
				array.push(b);
			}
		}
		return array;	
	};
	
	$http.get('json/facetValues.json').success(function(data) {
		$scope.query = data.sQuery;
		
		var facetGroups = [
			{ label: 'Campus', facets: convert(data.oFacetState.facet_campus) },
			{ label: 'Terms', facets: convert(data.oFacetState.facet_terms, 2) },
			{ label: 'Gen Ed', facets: convert(data.oFacetState.facet_gened, 1) },
			{ label: 'Credits', facets: convert(data.oFacetState.facet_credits, 10) },
			{ label: 'Class Level', facets: convert(data.oFacetState.facet_level, 4) },
			{ label: 'Subject', facets: convert(data.oFacetState.facet_subject, 8) },
			{ label: 'Keywords', facets: convert(data.oFacetState.facet_keywords, 8) }
		];
		
		$scope.facetGroups = facetGroups;
	});

	$http.get('json/search.json').success(function(data) {
	
		// Transform the returned data as a temporary patch, until better formed data is generated dynamically
		var courses = {
			count: data.iTotalRecords,
			results: []
		}
	
		for(var i = 0, n = data.aaData.length; i < n; i++) {
			var r = data.aaData[i];
			
			// Dive deep into the markup
			var wrapper = document.createElement('div');
			wrapper.innerHTML = r[2];
			var title = wrapper.firstChild.firstChild.firstChild.nodeValue;
			
			/*
			 * Offering
			 * 0: Not offered
			 * 1: Typically offered
			 * 2: Offered
			 */
			 
			var bookmark = getRandomInt(0,1) == 0 ? null : Date.now();
			//bookmark = null;
			
			courses.results.push({
				id: i,
				campus: r[0],
				subject: r[1],
				title: title,
				credits: r[3],
				bookmark: bookmark,
				_bookmark: bookmark, // Retain restore
				get bookmarked() { return this.bookmark != null; },
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
				offering: [
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
					},
				],
				description: 'An exploration of the relationships among musics of West and Central African people and their descendants in the United States, Latin America, and the Caribbean. Emphasis placed on the conceptual and aesthetic continuities between musical expression in Old and New World contexts—a uniformity which exists because of shared African cultural ancestry. Credit given for only one of AAAD A112, FOLK E112, or FOLK F112.'
			});
		}
	
		$scope.courses = courses;
		
		$scope.numberOfPages = Math.ceil($scope.courses.count / $scope.resultsPerPage);
		$scope.currentPage = 1;
		$scope.maxPageSize = 5;
	});
	
	$scope.openFacetGroupDialog = function(facetGroup) {
	
		var opts = {
			templateUrl: 'partials/modal.facet-group.html',
			controller: 'FacetGroupDialogController',
			// Duplicate the facetGroup object to allow easy cancelation.
			resolve: { facetGroup: function() { return angular.copy(facetGroup); } }
		};
		
		var d = $dialog.dialog(opts);
		d.open().then(function(result) {
			if(result) {
				// Copy back changes into the original facetGroup object
				angular.copy(result.facetGroup, facetGroup);
			}
		});
	};
}

// the dialog is injected in the specified controller
function FacetGroupDialogController($scope, dialog, facetGroup) {
	$scope.facetGroup = facetGroup;
	$scope.close = function() {
		// Result
		dialog.close({ facetGroup: $scope.facetGroup });
	};
}

function CourseDetailCtrl($scope, $routeParams, $http) {
	//$scope.sessions = Session.query();
	$scope.orderProp = 'title';
	$scope.routeParams = $routeParams;

	$scope.isFavorite = function(session) {
		if( !$scope.favorites )
			return true;
    	return session.favorite == true;
    };
    
	$http.get('sessions.json').success(function(data) {
		$scope.sessions = data;
		
		angular.forEach(data, function(item) {
			if (item.id == $routeParams.sessionId) 
				$scope.session = item;
		});
	});
}

function BookmarksCtrl($scope, $routeParams, $http, $dialog) {
	
	/*
	 * Most of this should be exchanged for an API call, once available
	 */
	 
	var bookmarks = {
		count: 0,
		undos: 0, // Number of bookmarks unbookmarked
		get active() { return this.count - this.undos },
		restore: function(course) {
			this.undos--;
			course.restoreBookmark();
		},
		undo: function() {
			this.undos++;
		},
		results: []
	};
	
	angular.forEach($scope.$parent.$parent.courses.results, function(value, key) {
		if( value.bookmarked )
			bookmarks.results.push(value);
	});
	
	bookmarks.count = bookmarks.results.length;
	//bookmarks.count = 0;
	
	$scope.bookmarks = bookmarks;
	
	$scope.numberOfPages = Math.ceil($scope.bookmarks.count / $scope.resultsPerPage);
	$scope.currentPage = 1;
	$scope.maxPageSize = 5;
	$scope.singularListItemName = 'bookmark';
	$scope.pluralListItemName = 'bookmarks';
	$scope.sortOrderPredicate = '-_bookmark';
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/*
function PhoneDetailCtrl($scope, $routeParams, Session) {

  $scope.phone = Phone.get({ phoneId:$routeParams.phoneId }, function(phone) {
    $scope.mainImageUrl = phone.images[0];
  });

}
PhoneDetailCtrl.$inject = ['$scope', '$routeParams', 'Phone'];
*/