let lastUrl = "";
let lastActiveTime = Date.now();

// Get current active tab when extension loads
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    lastUrl = tabs[0].url;
    lastActiveTime = Date.now();
    console.log("Initial URL:", lastUrl);
  }
});

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return "unknown";
  }
}

function saveTime(domain, duration) {
  if (!domain || domain === "unknown") return;

  // Load the productivity classification JSON
  fetch(chrome.runtime.getURL("productivityMap.json"))
    .then((res) => res.json())
    .then((map) => {
      // Determine if the domain is productive/unproductive/neutral
      const type = map.productive.includes(domain)
        ? "productive"
        : map.unproductive.includes(domain)
        ? "unproductive"
        : "neutral";

      const key = `${type}:${domain}`;

      chrome.storage.local.get([key], (res) => {
        const current = res[key] || 0;
        chrome.storage.local.set({ [key]: current + duration }, () => {
          console.log(`Saved ${current + duration}ms for ${key}`);
        });
      });
    })
    .catch((err) => {
      console.error("Error loading productivity map:", err);
    });
}


chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const now = Date.now();
  const duration = now - lastActiveTime;
  const domain = getDomain(lastUrl);
  saveTime(domain, duration);

  try {
    const tab = await chrome.tabs.get(tabId);
    lastUrl = tab.url;
    lastActiveTime = now;
    console.log("Activated →", lastUrl);
  } catch (err) {
    console.error("Error in onActivated:", err);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === "complete") {
    const now = Date.now();
    const duration = now - lastActiveTime;
    const domain = getDomain(lastUrl);
    saveTime(domain, duration);

    lastUrl = tab.url;
    lastActiveTime = now;
    console.log("Updated →", lastUrl);
  }
});
