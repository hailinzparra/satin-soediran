if (chrome && chrome.action && chrome.tabs && chrome.runtime) {
    chrome.action.onClicked.addListener(() => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('popup.html')
        })
    })
}
