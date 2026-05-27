function sortTabs(tabs, method) {
  switch (method) {
    case "domain":
      return [...tabs].sort((a, b) => {
        const domainA = new URL(a.url).hostname;
        const domainB = new URL(b.url).hostname;
        return domainA.localeCompare(domainB);
      });
    case "title":
      return [...tabs].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    case "recent":
      return [...tabs].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    case "pinned":
      return [...tabs].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    default:
      return tabs;
  }
}

document.getElementById("merge").addEventListener("click", async () => {
  const status = document.getElementById("status");
  const sortMethod = document.getElementById("sortOrder").value;

  const windows = await chrome.windows.getAll({ populate: true });

  if (windows.length <= 1 && sortMethod === "none") {
    status.textContent = "Nothing to merge.";
    return;
  }

  const [target, ...rest] = windows;

  // Collect all tabs from other windows and move them
  for (const win of rest) {
    const tabIds = win.tabs.map(t => t.id);
    await chrome.tabs.move(tabIds, { windowId: target.id, index: -1 });
  }

  // If sorting is requested, re-sort all tabs in the target window
  if (sortMethod !== "none") {
    const allTabs = await chrome.tabs.query({ windowId: target.id });
    const safeTabs = allTabs.filter(t => {
      try { new URL(t.url); return true; } catch { return false; }
    });
    const sorted = sortTabs(safeTabs, sortMethod);
    for (let i = 0; i < sorted.length; i++) {
      await chrome.tabs.move(sorted[i].id, { windowId: target.id, index: i });
    }
  }

  const label = {
    none: "Tabs consolidated.",
    domain: "Sorted by domain.",
    title: "Sorted A–Z.",
    recent: "Sorted by recent.",
    pinned: "Pinned tabs first."
  }[sortMethod];

  status.textContent = `${windows.length > 1 ? windows.length + " windows merged. " : ""}${label}`;
});