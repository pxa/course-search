'use strict';

/* Controllers */

function CourseSearchCtrl($scope, $routeParams, $http, $dialog) {
	
	$http.get('json/facetValues.json').success(function(data) {
		$scope.query = data.sQuery;
		
		var convert = function(obj) {
			var a = [];
			for( var key in obj ) {
				a.push({ label:key, count:obj[key].count, checked:obj[key].checked });
			}
			return a;
		}
		
		var facetGroups = [
			{ label: 'Campus', facets: convert(data.oFacetState.facet_campus) },
			{ label: 'Terms', facets: convert(data.oFacetState.facet_terms) },
			{ label: 'Gen Ed', facets: convert(data.oFacetState.facet_gened) },
			{ label: 'Credits', facets: convert(data.oFacetState.facet_credits) },
			{ label: 'Class Level', facets: convert(data.oFacetState.facet_level) },
			{ label: 'Subject', facets: convert(data.oFacetState.facet_subject) },
			{ label: 'Keywords', facets: convert(data.oFacetState.facet_keywords) }
		];
		
		$scope.facetGroups = facetGroups;
	});
	
	var resultsPerPage = 20;
	
	function getRandomInt(min, max) {
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	}

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

			courses.results.push({
				id: i,
				campus: r[0],
				subject: r[1],
				title: title,
				credits: r[3],
				bookmarked: getRandomInt(0,1) == 1,
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
		
		$scope.numberOfPages = Math.ceil($scope.courses.count / resultsPerPage);
		$scope.currentPage = 3;
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

//PhoneListCtrl.$inject = ['$scope', 'Phone'];


/*
function SessionDetailCtrl($scope, $routeParams, Session) {

  $scope.phone = Phone.get({ phoneId:$routeParams.phoneId }, function(phone) {
    $scope.mainImageUrl = phone.images[0];
  });

  $scope.setImage = function(imageUrl) {
    $scope.mainImageUrl = imageUrl;
  }

}
  */
//PhoneDetailCtrl.$inject = ['$scope', '$routeParams', 'Phone'];
