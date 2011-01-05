function Properties() {
    var me = this;
    var properties = ['LastSync', 'Version'];
    var propertyValues = {};
    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.getApplicationDataDirectory() + '/GuidesForDesktop.config');
    var needsSave = false;

    for (var i = 0; i < properties.length; i++) {
        (function(property) {
            var changeEvent = 'Property-' + property + '-Changed';
            me['set' + property] = function(value) {
                if (propertyValues[property] == value) {
                    return;
                }
                propertyValues[property] = value;
                needsSave = true;
                Titanium.API.fireEvent(changeEvent, { value: value });
            };
            me['get' + property] = function() {
                return propertyValues[property];
            };
            me['on' + property + 'Changed'] = function(listener) {
                Titanium.API.addEventListener(changeEvent, listener);
            };
        })(properties[i]);
    }

    this.load = function() {
        if (file.exists()) {
            try {
                propertyValues = JSON.parse(file.read() || '{}') || {};
                return;
            } catch(err) {
                alert(err);
            }
        }
        propertyValues = {};
        loaded = true;
    };
    this.save = function() {
        if (!needsSave) {
            return;
        }
        try {
            file.write(JSON.stringify(propertyValues || {}));
        } catch(err) {
            alert(err);
        }
        needsSave = false;
    };
}