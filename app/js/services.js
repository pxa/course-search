'use strict';

/* Services */


angular.module('courseSearchApp.services', ['ngResource'])

	.factory('Facet', function($resource) {
		return $resource('https://test.uisapp2.iu.edu/sissrarm-unt/arm-ks/myplan/course/facetValues?campusParam=edu.iu.sis.acadorg.SisInstitution.IUBLA,edu.iu.sis.acadorg.SisInstitution.IUINA&termParam=any&queryText=math&casticket=ST-1703-rxcPemOBOpacKT9oiooY-casstg02.uits.iu.edu', {}, {
			query:{ method:'GET', isArray:false }
		});
	})
	
	.value('version', '0.1');
