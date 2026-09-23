const NO_GROUP = chrome.tabGroups.TAB_GROUP_ID_NONE;

function hostname(url) {
  try { return new URL(url).hostname; } catch { return ""; }
}

function sortTabs(tabs, method) {
  switch (method) {
    case "domain":
      return [...tabs].sort((a, b) => hostname(a.url).localeCompare(hostname(b.url)));
    case "title":
      return [...tabs].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    case "recent":
      return [...tabs].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    default:
      return tabs;
  }
}

// Named groups A-Z first, then unnamed groups in their current order
function sortGroups(groups, firstIndex) {
  return [...groups].sort((a, b) => {
    const titleA = (a.title || "").trim();
    const titleB = (b.title || "").trim();
    if (titleA && !titleB) return -1;
    if (!titleA && titleB) return 1;
    if (titleA && titleB) {
      const byName = titleA.localeCompare(titleB, undefined, { sensitivity: "base", numeric: true });
      if (byName !== 0) return byName;
    }
    return firstIndex[a.id] - firstIndex[b.id];
  });
}

document.getElementById("merge").addEventListener("click", async () => {
  const status = document.getElementById("status");
  const sortMethod = document.getElementById("sortOrder").value;

  const windows = await chrome.windows.getAll({ populate: true });
  const [target, ...rest] = windows;

  // Move groups as whole units so they stay intact, then the loose tabs
  for (const win of rest) {
    const groups = await chrome.tabGroups.query({ windowId: win.id });
    for (const group of groups) {
      await chrome.tabGroups.move(group.id, { windowId: target.id, index: -1 });
    }
    const looseIds = win.tabs.filter(t => t.groupId === NO_GROUP).map(t => t.id);
    if (looseIds.length) {
      await chrome.tabs.move(looseIds, { windowId: target.id, index: -1 });
    }
  }

  const allTabs = await chrome.tabs.query({ windowId: target.id });
  const groups = await chrome.tabGroups.query({ windowId: target.id });

  if (windows.length <= 1 && sortMethod === "none" && groups.length === 0) {
    status.textContent = "Nothing to merge.";
    return;
  }

  // Pinned tabs stay put; groups line up right after them
  const firstIndex = {};
  for (const tab of allTabs) {
    if (tab.groupId !== NO_GROUP && !(tab.groupId in firstIndex)) {
      firstIndex[tab.groupId] = tab.index;
    }
  }
  let cursor = allTabs.filter(t => t.pinned).length;

  for (const group of sortGroups(groups, firstIndex)) {
    await chrome.tabGroups.move(group.id, { index: cursor });
    const groupTabs = allTabs.filter(t => t.groupId === group.id);

    if (sortMethod !== "none") {
      const sorted = sortTabs(groupTabs, sortMethod);
      const lastIndex = cursor + groupTabs.length - 1;
      for (const tab of sorted) {
        await chrome.tabs.move(tab.id, { index: lastIndex });
        // Re-assert membership in case the move landed on the group edge
        await chrome.tabs.group({ groupId: group.id, tabIds: tab.id });
      }
    }
    cursor += groupTabs.length;
  }

  // Loose tabs follow the groups in the selected order
  if (sortMethod !== "none") {
    const loose = allTabs.filter(t => !t.pinned && t.groupId === NO_GROUP);
    for (const tab of sortTabs(loose, sortMethod)) {
      await chrome.tabs.move(tab.id, { index: -1 });
    }
  }

  const label = {
    none: "Tabs consolidated.",
    domain: "Sorted by domain.",
    title: "Sorted A–Z.",
    recent: "Sorted by recent."
  }[sortMethod];

  const parts = [];
  if (windows.length > 1) parts.push(`${windows.length} windows merged.`);
  if (groups.length) parts.push(`${groups.length} group${groups.length > 1 ? "s" : ""} first.`);
  parts.push(label);
  status.textContent = parts.join(" ");
});
