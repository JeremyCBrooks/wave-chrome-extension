let settings = {
    api_token:'',
    business_id:'',
    statement_template:'',
    
    readSetting: async function readSetting(key) {
        return new Promise((resolve) => {
            chrome.storage.sync.get([key], function (result) {
                resolve(result[key]);
            });
        })
    },

    saveSettings: async function (values) {
        chrome.storage.sync.set(values);
        await settings.loadSettings();
    },

    loadSettings: async function () {
        let value = await settings.readSetting("api_token");
        settings.api_token = value;

        value = await settings.readSetting("business_id");
        settings.business_id = value;

        value = await settings.readSetting("statement_template");
        settings.statement_template = value;
    },
};