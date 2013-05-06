'use strict';


// Declare app level module which depends on filters, and services
angular.module('courseSearchApp', ['courseSearchApp.filters', 'courseSearchApp.services', 'courseSearchApp.directives', 'ui', 'ui.compat', 'ui.bootstrap'])

	.config(['$stateProvider', '$routeProvider', '$urlRouterProvider', function($stateProvider, $routeProvider, $urlRouterProvider) {

		var dynamicStateController = function(stateName) {
			return function($rootScope, $state) {
				// Inject the literal path, because $state doesn't naturally provide it,
				// and because the $state.transitionTo() approach would hide link URLs.
				$state.current.url = $rootScope.$location.url();
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
				templateUrl: 'partials/course.search.html'
			})
			.state('course.search.query', {
				url: '/search',
				templateUrl: 'partials/course.search.query.html',
				controller: dynamicStateController('course.search')
			})
			.state('course.search.results', {
				abstract: true,
				templateUrl: 'partials/course.search.results.html',
				controller: function($scope, $state) {
					// Override the query based on the parameter, once the controller initiates
					$scope.searchModel.query = $state.params.query;
				}
			})
			.state('course.search.results.list', {
				url: '/search/{criteriaKey}/{query}?page',
				templateUrl: 'partials/course.search.results.list.html',
				controller: function($scope, $state, $rootScope, $location, $anchorScroll, $timeout, $window) {
				
					// Current page default
					$scope.currentPage = parseInt($state.params.page) || 1;
					
					var pageHasCache = function(page) {
						// No cache found
						if( !$scope.pageCache[page] ) {
						
							// Form a new cache for the current page
							for( var i = 0, start = (page - 1) * $scope.resultsPerPage, pageResults = []; i < $scope.resultsPerPage; i++ ) {
								var r = $scope.resultsCache[start + i];
								if( r )
									pageResults.push(r);
							}
					
							if( pageResults.length ) {
								console.log('generating new page cache', page);
								$scope.pageCache[page] = pageResults;
							}
						}
						
						return angular.isDefined($scope.pageCache[page]);
					};
					
					var preloadResults = function(page) {
					
						// Ignore if page is already cached
						if( pageHasCache(page) )
							return;
							
						// Get new set of results for this page
						$scope.searchCourses(page, false, function() {
							console.log('preloaded page', page);
						});
					};

					var loadResultsFromCache = function(page) {
						
						// Attempt to load from page cache
						if( pageHasCache(page) ) {
						
							console.log('transitioning to page', page);
							
							$scope.isLoadingResults = false;
							$scope.results = $scope.pageCache[page];
							
							// Since page defaults to `1`, clear it to clean the url
							$state.params.page = page == 1 ? null : page;
						
							// Because `$state.transitionTo()` wrongly thinks we aren't navigating with different parameters,
							// we have to manually transition.

							// Transition
							$location.url($state.$current.navigable.url.format($state.params));
							// Save the state for dynamic urls
							dynamicStateController('course.search')($rootScope, $state);
						
							return true;
						}
						
						console.log('no cache for page', page);
						return false;
					};
					
					var loadPage = function(page) {
						
						if( loadResultsFromCache(page) ) {
							// Dynamically load the next cache set
							//preloadResults(page + 1);
							return;
						}
						
						$scope.isLoadingResults = true;
						
						// Get new set of results for this page
						$scope.searchCourses(page, false);
					};
					
					// Deep linked, but attempt to fulfill request
					if( !$scope.results.length )
						loadPage($scope.currentPage);
					
					// Pagination handler
					$scope.selectPage = function(page) {
						loadPage(page);
					};
					
					/*
					$location.hash('course-3');
					$timeout(function() {
						$anchorScroll();
					}, 50);
					$timeout(function() {
						$window.scrollBy(0, -133);
					}, 400);
					*/
					
					dynamicStateController('course.search')($rootScope, $state);
				}
			})
			.state('course.search.results.detail', {
				url: '/search/{criteriaKey}/{query}/{courseId}',
				templateUrl: 'partials/course.search.results.detail.html',
				controller: function($scope, $state, $document, $location, $rootScope) {
				
					$scope.resultsListUrl = ['#/search', $state.params.criteriaKey, $state.params.query].join('/');
				
					// Find the course for the given parameter
					$scope.course = $scope.resultsCache[$state.params.courseId];
					
					// Save the state
					dynamicStateController('course.search')($rootScope, $state);
					
					/*
					$document.bind('keydown', function(e) {
					
						var c = null;
						switch(e.which) {
							case 39: // right
								//$location.path($scope.course.next.url);
								//console.log('work');
								//$location.url('/search/math/MATH 101');
								
								break;
							case 37: // left
								break;
						}
						
						$state.params.courseId = $scope.course.next.subject;
						$state.transitionTo('course.search.results.detail', $state.params);
						console.log(e.which, $state.params, $scope.course.next.url);
					});
					*/
				}
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