chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action == "showIcon") {
		var tabId = sender.tab.id;
		var manifest = chrome.runtime.getManifest();
		chrome.pageAction.show(tabId);
		chrome.pageAction.setTitle({
			tabId: sender.tab.id,
			title: manifest.name + " " + manifest.version
		});
	}
});

chrome.pageAction.onClicked.addListener(function (tab) {
	var extHomeUrl = "https://chrome.google.com/webstore/detail/ihelper/egolnaplkencbhiljfedeppleoljegdg";
	chrome.tabs.create({ url : extHomeUrl});
});