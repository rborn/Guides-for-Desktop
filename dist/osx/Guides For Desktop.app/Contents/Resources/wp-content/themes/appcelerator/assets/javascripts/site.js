$(document).ready(function() {

	// Function to handle TOC building
	(function() {
		// Cache the chapter wrapper (<ol>)
		var chapters = $('.chapters');

		if(chapters) {
			// Filter all h3's in the #mainCol
			$('#mainCol').find('h3').each(function(index) {
				var elem 	= $(this);
				var subElem = $(this).find('a');

				// Append each header to the TOC
				if(elem.attr('id')) {
					chapters.append('<li><a href="#' + elem.attr('id') + '">' + elem.text() + '</a></li>');
				} else if(subElem.attr('id')) {
					chapters.append('<li><a href="#' + subElem.attr('id') + '">' + subElem.text() + '</a></li>');
				}
			});			
		}
		
	})();

});
