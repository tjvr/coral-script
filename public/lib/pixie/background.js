(function() {
  'use strict';

  chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
      innerBounds: {
        width: 960,
        height: 600,
        minWidth: 960,
        minHeight: 600
      },
      state: 'maximized'
    });
  });

}());
