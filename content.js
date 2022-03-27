async function insertStatementMessage() {
    document.activeElement.value = 'Generating statement message. When this is blank, message is ready to be pasted...';
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