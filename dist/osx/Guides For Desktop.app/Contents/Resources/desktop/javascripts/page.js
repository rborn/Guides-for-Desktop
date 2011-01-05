var page = {
    maxDownloadCount: 4,
    currentDownloadCount: 0,
    downloadAndShow: function(url) {
        var me = this;
        me.download(url, function() {
            me.show(url);
        });
    },
    getEncodedNameFromUrl: function(url) {
        return Titanium.Codec.checksum(url);
    },
    clearAllOfflinePages: function() {
        var dir = Titanium.Filesystem.getFile(Titanium.Filesystem.getApplicationDataDirectory() + '/pages/');
        if (dir.exists()) {
            dir.deleteDirectory(true);
            console.log('DESKTOP - PAGE - cleared existing offline pages.');
        }
        dir.createDirectory();
    },
    getFileFromUrl: function(url) {
        return Titanium.Filesystem.getFile(
        Titanium.Filesystem.getApplicationDataDirectory()
        + '/pages/'
        + this.getEncodedNameFromUrl(url)
        + '.html');
    },
    show: function(url) {
        // TODO: does this work on windows? linux? file:// might not...
        Titanium.UI.getMainWindow().setURL('file://' + encodeURI(this.getFileFromUrl(url).nativePath()));
    },
    download: function(url, onSuccess, onFailure) {
        var xhr = Titanium.Network.createHTTPClient();
        var me = this;

        if (me.currentDownloadCount >= me.maxDownloadCount) {
            setTimeout( function() {
                // too many downloads! let's wait...
                me.download(url, onSuccess, onFailure);
            }, 500);
            return;
        }

        if (me.getFileFromUrl(url).exists()) {
            // we already have this file!
            console.log('DESKTOP - PAGE - ' + url + ' already downloaded to phone; using existing instead of downloading.');
            onSuccess && onSuccess();
            return;
        }

        me.currentDownloadCount += 1;

        xhr.onload = function(e) {
            me.currentDownloadCount -= 1;
            try {
                console.log('DESKTOP - PAGE - received response from server, parsing...');
                // grab the html
                var html = this.responseText
                // changes jQuery references to a local file
                .split('http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js')
                .join('app://wp-content/themes/appcelerator/assets/javascripts/jquery-1.4.4-min.js')
                // make base domain references into local ones
                .split(options.baseURL)
                .join('app://')
                // inject our local, desktop specific script tags before the closing body tag
                .split('</body>')
                .join(''
                +'<link rel="stylesheet" type="text/css" href="app://desktop/stylesheets/desktop.css" />'
                +'<script type="text/javascript" src="app://desktop/javascripts/options.js"></script>'
                +'<script type="text/javascript" src="app://desktop/javascripts/properties.js"></script>'
                +'<script type="text/javascript" src="app://desktop/javascripts/page.js"></script>'
                +'<script type="text/javascript" src="app://desktop/javascripts/desktop.js"></script>'
                +'<script type="text/javascript">desktop.init();</script>'
                +'</body>');

                console.log('DESKTOP - PAGE - parsed. writing out to file..');
                me.getFileFromUrl(url).write(html);
                console.log('DESKTOP - PAGE - FINISHED download of ' + url);
                onSuccess && onSuccess(e);
            } catch (err) {
                console.log('DESKTOP - PAGE - ERRORED parsing of ' + url + ': ' + err);
                onFailure && onFailure(err);
            }
        };
        xhr.onerror = function(e) {
            me.currentDownloadCount -= 1;
            console.log('DESKTOP - PAGE - ERRORED download of ' + url + ': ' + e);
            onFailure && onFailure(e);
        };
        // open the client
        console.log('DESKTOP - PAGE - starting download of ' + url);
        xhr.open('GET', url);
        xhr.send();
    }
};
