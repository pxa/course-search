'use strict';

/* Filters */

angular.module('courseSearchApp.filters', [])

.filter('interpolate', ['version', function(version) {
	return function(text) {
		return String(text).replace(/\%VERSION\%/mg, version);
	}
}])
	
.filter('meetingDays', function() {
	return function(meeting) {
	
		var a = [];
	
		if( meeting.sun )
			a.push('Su');
		if( meeting.mon )
			a.push('M');
		if( meeting.tue )
			a.push('Tu');
		if( meeting.wed )
			a.push('W');
		if( meeting.thu )
			a.push('Th');
		if( meeting.fri )
			a.push('F');
		if( meeting.sat )
			a.push('Sa');
		
		return a.join(' ');	
	}
})

	
.filter('instructors', function() {
	return function(instructors) {
		return instructors.join(', ');	
	}
});