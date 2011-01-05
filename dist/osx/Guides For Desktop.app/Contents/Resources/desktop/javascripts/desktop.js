var desktop = {};

/**
 * Initializes our desktop specific code. Checks if we have synced with the server yet. If we have, forward on to the index
 * page. If we have not, download the index page then forward to it.
 */
desktop.init = function(allowForward) {
    this.wireLastSyncWithUI();
    this.wireLinks();
    if (!allowForward) {
        return;
    }
    if (this.weHaveSynced()) {
        page.show(options.baseURL);
        return;
    }
    if (Titanium.Network.online) {
        this.sync();
    } else {
        Titanium.UI.getMainWindow().setURL('app://error.html');
    }
};
/**
 * Returns true if we have synced with the server at least once.
 */
desktop.weHaveSynced = function() {
    var properties = new Properties();
    properties.load();
    var version = properties.getVersion();
    return version != undefined && version == options.version && properties.getLastSync() != undefined;
};
/**
 * Figures out the last time that we synced, and returns a nicely formatted string representing it.
 */
desktop.wireLastSyncWithUI = function() {
    function formatDate(lastSync) {
        if (lastSync) {
            lastSync = new Date(lastSync);
            var curr_date = lastSync.getDate(), curr_month = lastSync.getMonth() + 1,
            curr_year = lastSync.getFullYear(), a_p = 'PM', curr_hour = lastSync.getHours(), curr_min = lastSync.getMinutes() + '';
            if (curr_hour == 0) {
                curr_hour = 12;
                a_p = 'AM';
            } else if (curr_hour > 12) {
                curr_hour = curr_hour - 12;
            } else {
                a_p = 'AM';
            }
            if (curr_min.length == 1) {
                curr_min = '0' + curr_min;
            }
            return curr_hour + ':' + curr_min + ' ' + a_p + ' ' + curr_month + '/' + curr_date + '/' + curr_year;
        } else {
            return 'Never';
        }
    }

    var ui = $('#desktop-lastUpdate');
    if (ui.length == 0) {
        $('#topNav .wrapper').prepend('<div id="desktop-lastUpdatedContainer">'
        +'Last Updated Guides:'
        +'<span id="desktop-lastUpdate">'
        +'</span>'
        +'<input type="button" value="Sync Now" />'
        +'</div>');
        ui = $('#desktop-lastUpdate');
    }

    $('#desktop-lastUpdatedContainer input').click( function() {
        if (Titanium.Network.online) {
            // invalidate the version property
            var properties = new Properties();
            properties.load();
            properties.setVersion('0');
            properties.save();
            // and navigate back to the loading page
            Titanium.UI.getMainWindow().setURL('app://loading.html');
        } else {
            alert('Unable to connect to the internet! '
            + 'Please make sure you are connected, and no '
            + 'firewalls or proxies are blocking this '
            + 'application from the internet.');
        }
    });
    var properties = new Properties();
    properties.load();
    properties.onLastSyncChanged( function(evt) {
        $('#desktop-lastUpdate').html(formatDate(evt.value));
    });
    $('#desktop-lastUpdate').html(formatDate(properties.getLastSync()));

};
/**
 * Replaces the click functionality for local links so that they load up what they should.
 */
desktop.wireLinks = function() {
    $('a[href^="app://"]').click( function(evt) {
        page.show($(this).attr('href').split('app://').join(options.baseURL));
        evt.preventDefault();
    });
};
/**
 * Syncs everything we need to be able to work offline.
 */
desktop.sync = function() {
    var pendingTasks = 0;

    // TODO: show progress to user as we do this

    // clear the disk
    page.clearAllOfflinePages();

    // download index
    pendingTasks += 1;
    console.log('DESKTOP - SYNC - downloading index starting...');
    page.download(options.baseURL, function() {
        pendingTasks -= 1;
    }, function(error) {
        pendingTasks -= 1;
    });
    // download json
    pendingTasks += 1;
    console.log('DESKTOP - SYNC - downloading json starting...');
    desktop.downloadJSON( function(response) {
        pendingTasks -= 1;
        console.log('DESKTOP - SYNC - json downloaded, parsing each...');
        var result = $.parseJSON(response);
        // iterate over each post
        for (var i = 0; i < result.count; i++) {
            (function(post) {
                // iterate over each category in the post
                for (var j = 0; j < post.categories.length; j++) {
                    (function(category) {
                        // download the category's page
                        pendingTasks += 1;
                        page.download(options.baseURL + '?cat=' + category.id, function() {
                            pendingTasks -= 1;
                        }, function(error) {
                            pendingTasks -= 1;
                        });
                    })(post.categories[j])
                }
                // download the post's page
                pendingTasks += 1;
                page.download(post.url, function() {
                    pendingTasks -= 1;
                }, function(error) {
                    pendingTasks -= 1;
                });
            })(result.posts[i]);
        }
    }, function(error) {
        pendingTasks -= 1;
    });
    var totalTasks = pendingTasks;
    console.log('DESKTOP - SYNC - ' + totalTasks + ' tasks to take care of before sync is done');
    (function checkIfTasksAreFinished() {
        if (pendingTasks > 0) {
            if (pendingTasks > totalTasks) {
                totalTasks = pendingTasks;
                console.log('DESKTOP - SYNC - ' + totalTasks + ' tasks to take care of before sync is done');
            }
            var percent = (totalTasks - pendingTasks) / totalTasks;
            $('#desktop-progressBar').css({width: (percent * 600) + 'px'});
            setTimeout( function() {
                checkIfTasksAreFinished();
            }, 30);
            return;
        }

        $('#desktop-progressBar').css({width: '600px'});

        console.log('DESKTOP - SYNC - finished downloading all pages, forwarding to starting page');
        // TODO: continue instead to last visited page (requires saving where they navigate as they navigate)
        page.show(options.baseURL);

        var properties = new Properties();
        properties.load();
        properties.setLastSync(new Date().getTime());
        properties.setVersion(options.version);
        properties.save();
    })();
};
/**
 * Downloads the latest JSON.
 */
desktop.downloadJSON = function(onSuccess, onFailure) {
    var xhr = Titanium.Network.createHTTPClient();
    xhr.onload = function(e) {
        onSuccess && onSuccess(this.responseText);
    };
    xhr.onerror = function(e) {
        onFailure && onFailure(e);
    };
    // open the client
    xhr.open('GET', options.baseURL + '?json=get_recent_posts&post_type=Guides&include=url,categories&count=9999');
    xhr.send();
};
