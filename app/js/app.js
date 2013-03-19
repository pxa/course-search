'use strict';


// Declare app level module which depends on filters, and services
angular.module('courseSearchApp', ['courseSearchApp.filters', 'courseSearchApp.services', 'courseSearchApp.directives']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider
			.when('/', { templateUrl:'partials/course-search.html', controller:CourseSearchCtrl })
			.when('/:courseId', { templateUrl:'partials/course-detail.html', controller:CourseDetailCtrl })
			.otherwise({ redirectTo:'/' });
}]);