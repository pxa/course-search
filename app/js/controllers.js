'use strict';

/* Controllers */

function CourseSearchCtrl($scope, $routeParams, $http, $dialog, $timeout, $state, searchService) {
	
	$scope.keyup = function($event) {
		console.log($event);	
	};
	
	//console.log(searchService);
	$scope.search = searchService;
	
	var selectedFacets = function(source, arr) {
	
		// Generate an array, if one is not provided
		if( !angular.isArray(arr) )
			arr = [];
			
		// Loop through facets
		for( var i = 0, n = source.length; i < n; i++ ) {
			var facet = source[i];
				
			// Or add this facet's id if checked
			if( angular.isDefined(facet.id) && facet.id.length && facet.value == true )
				arr.push(facet);
				
			// Recursively find child facet ids
			if( angular.isArray(facet.facets) )
				selectedFacets(facet.facets, arr);
		}
		
		// Save for ease of access
		$scope.selectedFacets = arr;
		
		return arr;
	};

	var ids = function(source) {
		for( var i = 0, n = source.length, a = []; i < n; i++ )
			a.push(source[i].id);
		return a;
	};
	
	var selectedFacetIds = function() {
		return ids(selectedFacets($scope.search.criteria.facets));
	};
	
	var checkCondition = function(condition, ids) {

		// Converts something like this:
		// "10&&(0||1)" => "false&&(true||false)" => false
		
		// Split the string, matching ids
		var regex = /([\w.]+)/g;
		var conditional = condition.split(regex);

		// Process ids
		for( var i = 0, n = conditional.length; i < n; i++) {
			var a = conditional[i];
			
			// Ignore non-identifying strings
			if( a.match(regex) )
				// Replace with a bool indicating a match in the source ids
				conditional[i] = ids.indexOf(a) != -1;
		}
		
		// Rejoin
		conditional = conditional.join('');
		
		return $scope.$eval(conditional);
	};
	
	var checkFacets = function(source, ids, value) {
	
		// Determine the default facet source, if not supplied
		if( !angular.isArray(source) )
			source = $scope.search.criteria.facets;
	
		// Determine the selected facet ids, if not supplied
		if( !angular.isArray(ids) )
			ids = selectedFacetIds();
	
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
			source = $scope.search.criteria.facets;
	
		// Determine the selected facet ids, if not supplied
		if( !angular.isArray(ids) )
			ids = selectedFacetIds();
		
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
		return valid;
	};
	
	$scope.searchCourses = function($event) {
		if( $event )
			$event.preventDefault();
		if( validate() && $scope.search.query.length )
			$state.transitionTo('course.search.results.list', { criteriaKey: $scope.search.criteria.key, query: $scope.search.query });
	};
	
	$scope.checkFacets = function() {
		// When facet updates with errors, recheck validation
		if( !valid )
			validate();
		checkFacets();
	};
	
	// Check facets, based on supplied defaults
	$scope.checkFacets();
	
	// Apply a conditional value to facets
	var setFacetValue = function(source, funct) {
	
		if( !angular.isArray(source.facets) )
			return;
			
		// Loop through facets
		for( var i = 0, n = source.facets.length; i < n; i++ ) {
			var facet = source.facets[i];

			if( source.radio || source.select ) {
				facet.value = facet.id == source.value;
			}
			
			if( source.radio ) {
				setFacetValue(facet, function(f) {
					return facet.value && f.value;
				});
			}
			
			if( source.select ) {
				setFacetValue(facet, function(f) {
					return f.id == source.value;
				});
			}
			
			if( angular.isDefined(funct) ) {
				if( angular.isDefined(facet.value) )
					facet.value = funct(facet);
				setFacetValue(facet, funct);
			}
		}
	};
	
	$scope.selectOne = function(source) {
		
		// Attempt to find and pre-select the appropriate facet, if not set
		if( angular.isUndefined(source.value) ) {
			// Get the first of any selected child facets.
			var facets = selectedFacets(source.facets);
			// Check there's at least one returned.
			if( facets.length )
				// There will be an id and value for any of these facets.
				source.value = facets[0].id;
		}
		// Otherwise, change all child facet values to match single selection
		else {
			setFacetValue(source);
		}
	};
	
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
			
			// Provide a group label so an <optgroup> will be created
			if( angular.isUndefined(a.label) )
				a.label = ' ';
				
			for( var j = 0, m = a.facets.length; j < m; j++ ) {
				var b = angular.copy(a.facets[j]);
				b.group = a.label;
				array.push(b);
			}
		}
		return array;	
	};

	$scope.results = [];
	//$scope.currentPage = 1;
	$scope.maxPageSize = 5;
	
	/*
	$http.get('/sissrarm-cs-kart/myplan/course/s/json').success(function(data) {
		console.log($scope.search, data);
	}).error(function(data, status, headers, config) {
		console.log(data, '|', status, '|', headers, '|', config);
	});
	*/

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
			
			var course = {
				id: i,
				index: i + ($scope.resultsPerPage * (($scope.currentPage||1) - 1)),
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
				description: 'An exploration of the relationships among musics of West and Central African people and their descendants in the United States, Latin America, and the Caribbean. Emphasis placed on the conceptual and aesthetic continuities between musical expression in Old and New World contexts—a uniformity which exists because of shared African cultural ancestry. Credit given for only one of AAAD A112, FOLK E112, or FOLK F112.',
				get next() {
					return $scope.results[this.index + 1] || null;
				},
				get prev() { // Can't use `previous()`, for whatever reason.
					return this.index == 0 ? null : ($scope.results[this.index - 1] || null);
				},
				get url() {
					return ['#/search', $scope.search.criteria.key, $scope.search.query, this.subject].join('/');
				}
			};
			
			// Load the course to the view
			courses.results.push(course);
			
			// Load the course into cache, indexed by index and unique id
			$scope.results[course.index.toString()] = course;
			$scope.results[course.subject] = course;
		}
	//console.log($scope.results['MATH 00200']);
		$scope.search.count = courses.count;
		$scope.search.results = courses.results;
		$scope.numberOfPages = Math.ceil($scope.search.count / $scope.resultsPerPage);
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
	
	
	var terms = [
		{
			label: 'Spring 2013',
			sessions: [
				{
					label: 'Regular Academic Session',
					startDate: 'Jan 7',
					endDate: 'May 3',
					sections: [
						{
							id: '0001',
							component: 'Lecture',
							instructor: 'Dr. Manny',
							enrollment: { available: 3, total: 20 },
							location: { building: 'Business School', room: '219' },
							day: 'Mon, Wed',
							startTime: '08:00 AM',
							endTime: '08:50 AM',
							label: 'INTRO TO FINANCIAL ACCOUNTING',
							description: 'The concepts and issues associated with corporate financial reporting. Particular emphasis is placed on understanding the role of financial accounting in the economy and how different accounting methods affect the financial statements.'
						},
						{
							id: '0002',
							component: 'Lecture',
							instructor: 'Dr. Manny',
							enrollment: { available: 3, total: 20 },
							location: { building: 'Business School', room: '219' },
							day: 'Mon, Wed',
							startTime: '08:00 AM',
							endTime: '08:50 AM'
						}
					]
				}
			]
		}
	];
	
	$scope.terms = terms;	
	
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
	
	angular.forEach($scope.$parent.$parent.search.results, function(value, key) {
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