'use strict';


// Declare app level module which depends on filters, and services
angular.module('courseSearchApp', ['courseSearchApp.filters', 'courseSearchApp.services', 'courseSearchApp.directives', 'ui.compat', 'ui.bootstrap'])

	.config(['$stateProvider', '$routeProvider', '$urlRouterProvider', function($stateProvider, $routeProvider, $urlRouterProvider) {

		$stateProvider
			.state('course', {
				abstract: true,
				templateUrl: 'partials/course.html'
			})
			.state('course.search', {
				url: '/search',
				templateUrl: 'partials/course.search.html'
			})
			.state('course.plan', {
				url: '/plan',
				templateUrl: 'partials/course.plan.html'
			})
			.state('course.bookmarks', {
				url: '/bookmarks',
				templateUrl: 'partials/course.bookmarks.html'
			})
			.state('course.detail', {
				url: '/courses/{courseId}',
				templateUrl: 'partials/course.detail.html'
			});
	}])
	
	.run([ '$rootScope', '$state', '$stateParams', '$filter', function($rootScope, $state, $stateParams, $filter) {
		$rootScope.$state = $state;
		$rootScope.$stateParams = $stateParams;
		
		$rootScope.title = function(t) {
			return (t ? t + ' - ' : '') + 'Billing';
		}
		
		//$rootScope.dueDate = '2013-04-11';
		//$rootScope.dueDateString = $filter('date')($rootScope.dueDate, 'MMM d');

		$state.transitionTo('course.search');
	}]);
	
/*
	.config(['$routeProvider', function($routeProvider) {
	
		$routeProvider
			.when('/', { templateUrl:'partials/course-search.html', controller:CourseSearchCtrl })
			.when('/:courseId', { templateUrl:'partials/course-detail.html', controller:CourseDetailCtrl })
			.otherwise({ redirectTo:'/' });
			
	}]);
*/