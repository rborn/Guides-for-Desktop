var sync = {};

/**
 * Define the default options for syncing, such as the base URL.
 */
sync.defaultOptions = {
    baseURL: 'http://67.202.43.31/docs/'
};
/**
 * Checks if we have synced with the server yet. If we have, forward on to the index page. If we have not, download
 * the index page then forward to it.
 */
sync.checkSyncAndForward = function(options) {
    this.grabIndex(options);
};
/**
 * Grabs the index page.
 */
sync.grabIndex = function(options) {
    options = $.extend(options || {}, this.defaultOptions);

    alert(options.baseURL);
};