let utils = {
    currency: function (number) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(number);
    },

    convertToCSV: function (json) {
        var fields = Object.keys(json[0])
        var replacer = function (key, value) { return (undefined == value || value === null) ? '' : value.replace(/,/g, '\,') }
        var csv = json.map(function (row) {
            return fields.map(function (fieldName) {
                return JSON.stringify(row[fieldName], replacer)
            }).join(',');
        });
        csv.unshift(fields.join(',')); // add header column
        csv = csv.join('\r\n');

        return csv;
    },

    save: function (data, filename) {

        if (!data) {
            console.error('Console.save: No data')
            return;
        }

        if (!filename) { filename = 'console.json' }

        if (typeof data === "object") {
            data = JSON.stringify(data, undefined, 4)
        }

        var blob = new Blob([data], { type: 'text/json' }),
            e = document.createEvent('MouseEvents'),
            a = document.createElement('a')

        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
    },
};