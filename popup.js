document.getElementById("merge").addEventListener("click", async () => {
  const windows = await chrome.windows.getAll({ populate: true });

  if (windows.length <= 1) {
    document.getElementById("status").textContent = "Nothing to merge.";
    return;
  }

  const [target, ...rest] = windows;

  for (const win of rest) {
    const tabIds = win.tabs.map(t => t.id);
    await chrome.tabs.move(tabIds, { windowId: target.id, index: -1 });
  }

  document.getElementById("status").textContent = `Merged ${windows.length} windows!`;
});
