'use strict';

/* Controllers */

function CourseSearchCtrl($scope, $routeParams, $http) {
	
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
	
	$http.get('json/search.json').success(function(data) {
		$scope.results = data;
		//console.log($scope.results);
	});
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
