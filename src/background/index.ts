import browser from 'webextension-polyfill';
import store, { initializeWrappedStore } from '../app/store';

initializeWrappedStore();

store.subscribe(() => {
  // access store state
  // const state = store.getState();
});

// show welcome page on new install
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    //show the welcome page
    const url = browser.runtime.getURL('welcome/welcome.html');
    await browser.tabs.create({ url });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchBookmarks') {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      sendResponse({ bookmarks: bookmarkTreeNodes });
    });
    return true; // Will respond asynchronously.
  }
});
