chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'insert_statement_message',
    title: "Generate Statement Message",
    contexts: ["editable"],
    documentUrlPatterns: ["https://next.waveapps.com/*"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if ('insert_statement_message' === info.menuItemId) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "insertStatementMessage",
      });
    });
  }
});