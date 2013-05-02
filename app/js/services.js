'use strict';

/* Services */


angular.module('courseSearchApp.services', ['ngResource'])

.factory('Facet', function($resource) {
	return $resource('https://test.uisapp2.iu.edu/sissrarm-unt/arm-ks/myplan/course/facetValues?campusParam=edu.iu.sis.acadorg.SisInstitution.IUBLA,edu.iu.sis.acadorg.SisInstitution.IUINA&termParam=any&queryText=math&casticket=ST-1703-rxcPemOBOpacKT9oiooY-casstg02.uits.iu.edu', {}, {
		query:{ method:'GET', isArray:false }
	});
})

.factory('searchService', function($http) {

	var k = 0;
	
	// Higher `chance`, fewer random items
	var convert = function(obj, chance) {
		chance = chance ? chance : 0;
		var a = [];
		for( var key in obj ) {
			a.push({
				id: (++k).toString(),
				label: key,
				count: obj[key].count,
				value: chance ? getRandomInt(0, chance) == 0 : obj[key].checked
			});
		}
		return a;
	};
	
	var labelize = function(arr) {
		var a = [];
		for( var i = 0, n = arr.length; i < n; i++, ++k ) {
			a.push({ label: arr[i], value: false, id: k.toString() });
		}
		return a;
	};
	
	var campuses = labelize([
		'IU Bloomington', // id: 0
		'IUPUI Indianapolis', // id: 1
		'IUPUC Columbus',
		'IU East',
		'IPFW Fort Wayne',
		'IU Kokomo',
		'IU Northwest',
		'IU South Bend',
		'IU Southeast'
	]);
	
	campuses[0].value = true;
	
	var degrees = labelize([
		'Undergraduate',
		'Graduate', // id: 10
		'Professional'
	]);
	
	degrees[0].value = true;
	degrees[2].condition = "0||1"; // BL or IUPUI
	
	var scheduledTerms = labelize([
		'Spring 2013',
		'Summer 2013',
		'Fall 2013',
		'Winter 2013'
	]);
	
	// (BL & Grad) or (IUPUI & Grad)
	// "(0&10)|(1&10)"
	// Grad & (BL or IUPUI)
	// "10&(0|1)"
	scheduledTerms[3].condition = "10&&(0||1)";
	
	var projectedTerms = labelize([
		'Fall',
		'Spring',
		'Summer'
	]);
	
	// Until AngularJS supports comment repeaters,
	// `facets` and `groups` must be separated,
	// instead of smartly deriving object types.
	// Not sufficient flexibility, unfortunately.
	var searchCriteria = [
		{
			label: 'Campus',
			select: true, // Only one facet may be selected
			facets: [
				{ label: 'Campuses', facets: campuses },
				{ facets: labelize(['Online']) }
			]
		},
		{
			label: 'Degree Level',
			alerts: [ { type: 'error', message: 'Select a degree level.', condition: "!(9||10||11)" } ],
			facets: degrees
		},
		{
			label: 'Offered',
			alerts: [ { type: 'error', message: 'Select a term.', condition: "!any&&!(12||13||14||15||16||17||18)" } ],
			radio: true, // Only one facet may be selected
			facets: [
			  	{ label: 'Any term', id: 'any', value: true },
				{
					label: 'Specific term',
					id: '',
					value: false,
					facets: [
						{ label: 'Scheduled classes', facets: scheduledTerms },
						{ label: 'All courses', title: '(including scheduled classes)', facets: projectedTerms }
					]
				}
			]
		},
		{
			facets: [ { label: 'More than 10 years ago', id: (++k).toString() } ]
		}
	];

	var searchExamples = [
		{ label: 'Find english courses', examples: [ 'english', 'ENG', 'ENG-W' ] },
		{ label: 'Find a specific english course', examples: [ 'ENG-W 131' ] },
		{ label: 'Find 200-level english courses', examples: [ 'ENG 2*' ] }
	];
	
	var search = {
		
		query: null,
		placeholder: 'title, keyword, department, subject, or number',
		examples: searchExamples,
		criteria: {
			key: 'z6xx52',
			facets: searchCriteria }
		
	};

	$http.get('json/facetValues.json').success(function(data) {
		//search.query = data.sQuery;
		
		var facetGroups = [
			//{ label: 'Campus', facets: convert(data.oFacetState.facet_campus) },
			//{ label: 'Terms', facets: convert(data.oFacetState.facet_terms, 2) },
			{ label: 'Gen Ed', facets: convert(data.oFacetState.facet_gened, 1) },
			{ label: 'Credits', facets: convert(data.oFacetState.facet_credits, 10) },
			{ label: 'Class Level', facets: convert(data.oFacetState.facet_level, 4) },
			{ label: 'Subject', facets: convert(data.oFacetState.facet_subject, 8) },
			{ label: 'Keywords', facets: convert(data.oFacetState.facet_keywords, 8) }
		];
		
		search.filters = { facets: facetGroups };
	});
	
	return search;

})

.value('version', '0.1');
