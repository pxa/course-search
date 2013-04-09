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
				checked: chance ? getRandomInt(0, chance) == 0 : obj[key].checked
			});
		}
		return a;
	};
	
	var labelize = function(arr) {
		var a = [];
		for( var i = 0, n = arr.length; i < n; i++ ) {
			a.push({ label: arr[i], checked: false });
		}
		return a;
	};
	
	var campuses = [
		'IU Bloomington',
		'IUPUI Indianapolis',
		'IUPUC Columbus',
		'IU East',
		'IPFW Fort Wayne',
		'IU Kokomo',
		'IU Northwest',
		'IU South Bend',
		'IU Southeast'
	];
	
	var degrees = [
		'Undergraduate',
		'Graduate',
		'Professional'
	];
	
	var scheduledTerms = [
		'Spring 2013',
		'Summer 2013',
		'Fall 2013'
	];
	
	var projectedTerms = [
		'Fall',
		'Spring',
		'Summer'
	];
	
	// Until AngularJS supports comment repeaters,
	// `facets` and `groups` must be separated,
	// instead of smartly deriving object types.
	// Not sufficient flexibility, unfortunately.
	$scope.initSearch = [
		{
			label: 'Campus',
			selection: 'single',
			groups: [
				{ label: 'Campuses', facets: labelize(campuses) },
				{ label: '', facets: labelize(['Online']) }
			]
		},
		{ label: 'Degree Level', facets: labelize(degrees) },
		{
			label: 'Terms',
			selectAll: { label: 'Any term', checked: true },
			groups: [
				{ label: '', facets: labelize(scheduledTerms) },
				{ label: '', facets: labelize(projectedTerms) },
				{ label: '', facets: labelize(['Include courses not typically offered']) }
			]
		}
	];
	
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