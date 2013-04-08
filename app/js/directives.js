'use strict';

/* Directives */


angular.module('courseSearchApp.directives', [])
	.directive('appVersion', ['version', function(version) {
		return function(scope, elm, attrs) {
			elm.text(version);
		};
	}])
  
	// http://stackoverflow.com/a/14803274
	// http://plnkr.co/edit/gSeQL6XPaMsNSnlXwgHt
	.directive('checkboxAll', function() {
		return function(scope, iElement, iAttrs) {
			var groups = iAttrs.checkboxAll + '.groups';
			var facets = iAttrs.checkboxAll + '.facets';
			var checkedKey = 'checked';
			
			// Set appropriate values for conditions
			var autoAny = function(hasTrue, hasFalse) {
				var any = scope.$eval(iAttrs.checkboxAll + '.any');
				
				if (hasTrue && hasFalse) {
					any.checked = false;
					any.grayed = true;
				} else {
					any.checked = hasTrue;
					any.grayed = false;
				}
			};
			
			// Apply the value of select all to other checkboxes
			iElement.bind('change', function(evt) {
				scope.$apply(function() {
					var setValue = iElement.prop('checked');
					angular.forEach(scope.$eval(groups), function(group) {
						angular.forEach(group.facets, function(facet) {
							facet[checkedKey] = setValue;
						});
					});
					angular.forEach(scope.$eval(facets), function(facet) {
						facet[checkedKey] = setValue;
					});
				});
			});
			
			// Update the select all checkbox according to external changes
			scope.$watch(groups, function(newVal) {
				var hasTrue, hasFalse;
				angular.forEach(newVal, function(group) {
					angular.forEach(group.facets, function(facet) {
						if (facet[checkedKey]) {
							hasTrue = true;
						} else {
							hasFalse = true;
						}
					});
				});
				autoAny(hasTrue, hasFalse);
			}, true);
			scope.$watch(facets, function(newVal) {
				var hasTrue, hasFalse;
				angular.forEach(newVal, function(facet) {
					if (facet[checkedKey]) {
						hasTrue = true;
					} else {
						hasFalse = true;
					}
				});
				autoAny(hasTrue, hasFalse);
			}, true);
		};
	});
