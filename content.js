// DOM 3 Events
var dispatchKeyboardEvent = function (target, initKeyboradEvent_args) {
    var e = document.createEvent("KeyboardEvents");
    e.initKeyboardEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
};
var dispatchTextEvent = function (target, initTextEvent_args) {
    var e = document.createEvent("TextEvent");
    e.initTextEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
};
var dispatchSimpleEvent = function (target, type, canBubble, cancelable) {
    var e = document.createEvent("Event");
    e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
};

async function insertStatementMessage() {
    await settings.loadSettings();

    const email = document.querySelector("input[type='email']").value;
    const placeholder = document.activeElement.placeholder;
    const accounts = await api_client.getCombinedBalanceAndScoutAccounts(email);
    if (accounts.length > 0) {
        const matchAccounts = accounts.filter((a) => { return placeholder.includes(a.name); })
        if (matchAccounts.length > 0) {
            const account = matchAccounts[0];
            let statement_text = settings.statement_template;
            statement_text = statement_text.replace(/\{name\}/, account.name);
            statement_text = statement_text.replace(/\{scout_account_balance\}/, utils.currency(account.scoutAccountBalance));
            navigator.clipboard.writeText(statement_text);
            document.activeElement.value = '';
        }
    }
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === 'insertStatementMessage') {
        insertStatementMessage();
    }
    sendResponse({ status: 'ok' });
});