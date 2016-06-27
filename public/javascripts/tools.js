/* tools.js */

function isEmpty (obj) {
    if (obj == null) return true;
    if (obj.length > 0) return false;
    if (obj.length === 0)  return true;
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
    };
    return true;
};

function jsonToList (json) {
    // Very ugly..
    var div = document.createElement('div');
    div.id = 'ft-properties';
    var ul = document.createElement('ul');
    for (var key in json) {
        var val = json[key];
        var li = document.createElement('li');
        if( !isNaN(val)) {
            val = Intl.NumberFormat('fr-FR').format(val);
        } else {
            val = val.urlify();
        };
        li.innerHTML = '<code>' + key + '</code>: ' + val.urlify();
        ul.appendChild(li);
    };
    div.appendChild(ul);
    return div;
};

String.prototype.urlify = function () {
    return this.replace(/(^https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
};

String.prototype.replaceUnderscoreWthSpace = function () {
    return this.split('_').join(' ');
};

String.prototype.capitalize = function () {
    return this.replace(/(?:^|\s)\S/g, function(a) {
        return a.toUpperCase();
    });
};
