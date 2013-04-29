'use strict';


// Declare app level module which depends on filters, and services
angular.module('courseSearchApp', ['courseSearchApp.filters', 'courseSearchApp.services', 'courseSearchApp.directives', 'ui', 'ui.compat', 'ui.bootstrap'])

	.config(['$stateProvider', '$routeProvider', '$urlRouterProvider', function($stateProvider, $routeProvider, $urlRouterProvider) {

		var dynamicStateController = function(stateName) {
			return function($rootScope, $state) {
				// Inject the literal path, because $state doesn't naturally provide it,
				// and because the $state.transitionTo() approach would hide link URLs.
				$state.current.path = $rootScope.$location.path();
				$rootScope.state[stateName] = $state.current;
			};
		};

		$stateProvider
			.state('course', {
				abstract: true,
				templateUrl: 'partials/course.html',
				//controller: CourseSearchCtrl
			})
			.state('course.search', {
				abstract: true,
				//url: '/search',
				templateUrl: 'partials/course.search.html'
			})
			.state('course.search.query', {
				url: '/search',
				templateUrl: 'partials/course.search.query.html',
				controller: dynamicStateController('course.search')
			})
			.state('course.search.list', {
				url: '/search/{query}',
				templateUrl: 'partials/course.search.list.html',
				controller: dynamicStateController('course.search')
			})
			
			/*
			.state('course.search', {
				url: '/search',
				templateUrl: 'partials/course.search.html',
				data: {
					viewQuery: true
				}
			})
			/*
			.state('course.search.query', {
				url: '/search',
				templateUrl: 'partials/course.search.query.html'
			})
			.state('course.search.list', {
				url: '/search/{query}',
				templateUrl: 'partials/course.search.list.html'
			})
			*/
			.state('course.bookmarks', {
				url: '/bookmarks',
				templateUrl: 'partials/course.bookmarks.html',
				controller: BookmarksCtrl
			})
			/*
			.state('course.search.list', {
				url: '/search/list',
				//abstact: true,
				templateUrl: 'partials/course.list.html'
			})
			*/
			/*
			.state('course.search.list', {
				url: '/search',
				views: {
					'': {
						templateUrl: 'partials/course.list.html'
					}
				}
			})
			*/
			.state('course.plan', {
				url: '/plan',
				templateUrl: 'partials/course.plan.html'
			})
			.state('course.detail', {
				url: '/courses/{courseId}',
				templateUrl: 'partials/course.detail.html'
			});
	}])
	
	.run([ '$rootScope', '$state', '$stateParams', '$filter', '$location', function($rootScope, $state, $stateParams, $filter, $location) {
		$rootScope.$state = $state;
		$rootScope.$stateParams = $stateParams;
		$rootScope.$location = $location;
		
		$rootScope.resultsPerPage = 20;
		$rootScope.bookmarkAdded = false;
		
		$rootScope.title = function(t) {
			return (t ? t + ' - ' : '') + 'Billing';
		}
		
		// For primarily assigning dynamic urls to parent states
		$rootScope.state = [];
		
		$state.transitionTo('course.search.query');
		
		//$rootScope.dueDate = '2013-04-11';
		//$rootScope.dueDateString = $filter('date')($rootScope.dueDate, 'MMM d');
	}]);
	
/*
	.config(['$routeProvider', function($routeProvider) {
	
		$routeProvider
			.when('/', { templateUrl:'partials/course-search.html', controller:CourseSearchCtrl })
			.when('/:courseId', { templateUrl:'partials/course-detail.html', controller:CourseDetailCtrl })
			.otherwise({ redirectTo:'/' });
			
	}]);
*/