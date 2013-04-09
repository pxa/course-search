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
	.directive('selectAll', function() {
		return function(scope, iElement, iAttrs) {
			var groups = iAttrs.selectAll + '.groups';
			var facets = iAttrs.selectAll + '.facets';
			var checkedKey = 'checked';
			
			// Set appropriate values for conditions
			var autoSelectAll = function(hasTrue, hasFalse) {
				var selectAll = scope.$eval(iAttrs.selectAll + '.selectAll');
				
				if (hasTrue && hasFalse) {
					selectAll.checked = false;
					selectAll.grayed = true;
				} else {
					selectAll.checked = hasTrue;
					selectAll.grayed = false;
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
				autoSelectAll(hasTrue, hasFalse);
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
				autoSelectAll(hasTrue, hasFalse);
			}, true);
		};
	});
