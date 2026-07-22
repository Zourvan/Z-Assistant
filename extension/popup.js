const STRINGS = {
  en: {
    titleNew: "Bookmark & Reminder",
    titleExisting: "Reminder",
    alreadyBookmarked: "This page is already bookmarked.",
    bookmarkSection: "Bookmark",
    title: "Title",
    folder: "Folder",
    folderSearch: "Filter folders…",
    folderEmpty: "No folders match your filter",
    bookmarksBar: "Bookmarks bar",
    otherBookmarks: "Other bookmarks",
    mobileBookmarks: "Mobile bookmarks",
    reminder: "Reminder",
    date: "Date",
    time: "Time",
    note: "Note",
    notePlaceholder: "Why is this important?",
    cancel: "Cancel",
    save: "Save",
    unsupported: "This page cannot be bookmarked.",
    loadError: "Could not read the current tab.",
  },
  fa: {
    titleNew: "بوک‌مارک و یادآور",
    titleExisting: "یادآور",
    alreadyBookmarked: "این صفحه از قبل بوک‌مارک شده است.",
    bookmarkSection: "بوک‌مارک",
    title: "عنوان",
    folder: "پوشه",
    folderSearch: "فیلتر پوشه‌ها…",
    folderEmpty: "پوشه‌ای با این فیلتر پیدا نشد",
    bookmarksBar: "نوار بوک‌مارک‌ها",
    otherBookmarks: "سایر بوک‌مارک‌ها",
    mobileBookmarks: "بوک‌مارک‌های موبایل",
    reminder: "یادآور",
    date: "تاریخ",
    time: "ساعت",
    note: "یادداشت",
    notePlaceholder: "چرا این صفحه مهم است؟",
    cancel: "انصراف",
    save: "ذخیره",
    unsupported: "این صفحه قابل بوک‌مارک نیست.",
    loadError: "خواندن تب فعلی ممکن نشد.",
  },
};

const language = localStorage.getItem("language") === "fa" ? "fa" : "en";
const t = STRINGS[language];

document.documentElement.lang = language;
if (language === "fa") document.body.classList.add("is-rtl");

const els = {
  popupTitle: document.getElementById("popupTitle"),
  statusText: document.getElementById("statusText"),
  errorText: document.getElementById("errorText"),
  bookmarkSection: document.getElementById("bookmarkSection"),
  bookmarkSectionTitle: document.getElementById("bookmarkSectionTitle"),
  bookmarkTitleInput: document.getElementById("bookmarkTitleInput"),
  folderSelect: document.getElementById("folderSelect"),
  folderTrigger: document.getElementById("folderTrigger"),
  folderTriggerLabel: document.getElementById("folderTriggerLabel"),
  folderPanel: document.getElementById("folderPanel"),
  folderSearch: document.getElementById("folderSearch"),
  folderTree: document.getElementById("folderTree"),
  folderEmpty: document.getElementById("folderEmpty"),
  folderPicker: document.getElementById("folderPicker"),
  pageUrl: document.getElementById("pageUrl"),
  existingSection: document.getElementById("existingSection"),
  existingTitle: document.getElementById("existingTitle"),
  existingUrl: document.getElementById("existingUrl"),
  reminderEnabled: document.getElementById("reminderEnabled"),
  reminderFields: document.getElementById("reminderFields"),
  reminderDate: document.getElementById("reminderDate"),
  reminderTime: document.getElementById("reminderTime"),
  reminderNote: document.getElementById("reminderNote"),
  cancelBtn: document.getElementById("cancelBtn"),
  saveBtn: document.getElementById("saveBtn"),
  labelTitle: document.getElementById("labelTitle"),
  labelFolder: document.getElementById("labelFolder"),
  labelReminder: document.getElementById("labelReminder"),
  labelDate: document.getElementById("labelDate"),
  labelTime: document.getElementById("labelTime"),
  labelNote: document.getElementById("labelNote"),
};

els.popupTitle.textContent = t.titleNew;
els.bookmarkSectionTitle.textContent = t.bookmarkSection;
els.labelTitle.textContent = t.title;
els.labelFolder.textContent = t.folder;
els.folderSearch.placeholder = t.folderSearch;
els.folderEmpty.textContent = t.folderEmpty;
els.labelReminder.textContent = t.reminder;
els.labelDate.textContent = t.date;
els.labelTime.textContent = t.time;
els.labelNote.textContent = t.note;
els.reminderNote.placeholder = t.notePlaceholder;
els.cancelBtn.textContent = t.cancel;
els.saveBtn.textContent = t.save;

/** @type {{ id?: string, title: string, url: string, isBookmarked: boolean } | null} */
let pageState = null;

/** @type {Array<{ id: string, title: string, children: any[] }>} */
let folderRoots = [];

/** @type {Set<string>} */
let expandedIds = new Set(["1", "2"]);

/** @type {string} */
let selectedFolderId = "1";

const folderDisplayName = (id, title) => {
  if (id === "1") return t.bookmarksBar;
  if (id === "2") return t.otherBookmarks;
  if (id === "3") return t.mobileBookmarks;
  return title || "Folder";
};

const setDefaultDateTime = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  els.reminderDate.value = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, "0"),
    String(tomorrow.getDate()).padStart(2, "0"),
  ].join("-");
  els.reminderTime.value = "09:00";
};

const isBookmarkableUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const getActiveTab = () =>
  new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0] || null);
    });
  });

const findBookmarkByUrl = (url) =>
  new Promise((resolve) => {
    chrome.bookmarks.search({ url }, (results) => {
      resolve(results?.[0] || null);
    });
  });

const toFolderNode = (node) => {
  if (node.url) return null;
  const children = (node.children || [])
    .map(toFolderNode)
    .filter(Boolean);
  return {
    id: node.id,
    title: folderDisplayName(node.id, node.title),
    children,
  };
};

const loadFolderTree = () =>
  new Promise((resolve) => {
    chrome.bookmarks.getTree((tree) => {
      const roots = (tree?.[0]?.children || []).map(toFolderNode).filter(Boolean);
      resolve(roots);
    });
  });

const findFolderPath = (nodes, targetId, path = []) => {
  for (const node of nodes) {
    const next = [...path, node];
    if (node.id === targetId) return next;
    const found = findFolderPath(node.children || [], targetId, next);
    if (found) return found;
  }
  return null;
};

const filterFolderTree = (nodes, term) => {
  if (!term) return nodes.map((node) => ({ ...node, children: filterFolderTree(node.children || [], "") }));

  const result = [];
  for (const node of nodes) {
    const childMatches = filterFolderTree(node.children || [], term);
    const selfMatch = node.title.toLowerCase().includes(term);
    if (selfMatch || childMatches.length) {
      result.push({
        ...node,
        children: childMatches,
        forceOpen: childMatches.length > 0,
      });
    }
  }
  return result;
};

const updateTriggerLabel = () => {
  const path = findFolderPath(folderRoots, selectedFolderId);
  const label = path?.length
    ? path.map((n) => n.title).join(" / ")
    : folderDisplayName(selectedFolderId, "Folder");
  els.folderTriggerLabel.textContent = label;
  els.folderSelect.value = selectedFolderId;
};

const selectFolder = (id) => {
  selectedFolderId = id;
  updateTriggerLabel();
  renderFolderTree(els.folderSearch.value.trim());
  closeFolderPanel();
};

const toggleExpand = (id) => {
  if (expandedIds.has(id)) expandedIds.delete(id);
  else expandedIds.add(id);
  renderFolderTree(els.folderSearch.value.trim());
};

const createTreeNode = (node, depth, filterActive) => {
  const hasChildren = (node.children || []).length > 0;
  const isOpen = filterActive || node.forceOpen || expandedIds.has(node.id);
  const isSelected = node.id === selectedFolderId;

  const wrap = document.createElement("div");
  wrap.className = "folder-tree__node";
  wrap.setAttribute("role", "treeitem");
  wrap.setAttribute("aria-expanded", hasChildren ? String(isOpen) : "false");

  const row = document.createElement("div");
  row.className = `folder-tree__row${isSelected ? " is-selected" : ""}`;
  row.style.paddingInlineStart = `${depth * 14}px`;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = `folder-tree__toggle${hasChildren ? "" : " is-placeholder"}`;
  toggle.textContent = isOpen ? "▾" : "▸";
  toggle.tabIndex = hasChildren ? 0 : -1;
  if (hasChildren) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleExpand(node.id);
    });
  }

  const item = document.createElement("button");
  item.type = "button";
  item.className = "folder-tree__item";
  item.innerHTML = `
    <span class="folder-tree__item-icon" aria-hidden="true">📁</span>
    <span class="folder-tree__item-label${filterActive && node.title.toLowerCase().includes(els.folderSearch.value.trim().toLowerCase()) ? " folder-tree__mark" : ""}"></span>
  `;
  item.querySelector(".folder-tree__item-label").textContent = node.title;
  item.addEventListener("click", () => selectFolder(node.id));

  row.appendChild(toggle);
  row.appendChild(item);
  wrap.appendChild(row);

  if (hasChildren && isOpen) {
    const children = document.createElement("div");
    children.className = "folder-tree__children";
    children.setAttribute("role", "group");
    for (const child of node.children) {
      children.appendChild(createTreeNode(child, depth + 1, filterActive));
    }
    wrap.appendChild(children);
  }

  return wrap;
};

const renderFolderTree = (rawTerm = "") => {
  const term = rawTerm.trim().toLowerCase();
  const filtered = filterFolderTree(folderRoots, term);
  els.folderTree.innerHTML = "";

  if (!filtered.length) {
    els.folderEmpty.hidden = false;
    return;
  }

  els.folderEmpty.hidden = true;
  for (const node of filtered) {
    els.folderTree.appendChild(createTreeNode(node, 0, Boolean(term)));
  }
};

const openFolderPanel = () => {
  els.folderPanel.hidden = false;
  els.folderTrigger.setAttribute("aria-expanded", "true");
  els.folderSearch.focus();
  els.folderSearch.select();
};

const closeFolderPanel = () => {
  els.folderPanel.hidden = true;
  els.folderTrigger.setAttribute("aria-expanded", "false");
};

const toggleFolderPanel = () => {
  if (els.folderPanel.hidden) openFolderPanel();
  else closeFolderPanel();
};

const loadExistingReminder = async (bookmarkId, url) => {
  const result = await chrome.storage.local.get("nexx_reminders_cache");
  const reminders = result.nexx_reminders_cache || [];
  return (
    reminders.find(
      (r) =>
        !r.completedAt &&
        !r.dismissedAt &&
        (r.bookmarkId === bookmarkId || (url && r.bookmarkUrl === url)),
    ) || null
  );
};

const applyExistingReminder = (reminder) => {
  if (!reminder) {
    els.reminderEnabled.checked = true;
    els.reminderFields.hidden = false;
    setDefaultDateTime();
    return;
  }

  els.reminderEnabled.checked = true;
  els.reminderFields.hidden = false;
  const d = new Date(reminder.snoozeUntil || reminder.reminderAt);
  els.reminderDate.value = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  els.reminderTime.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  els.reminderNote.value = reminder.note || "";
};

els.folderTrigger.addEventListener("click", (e) => {
  e.preventDefault();
  toggleFolderPanel();
});

els.folderSearch.addEventListener("input", () => {
  renderFolderTree(els.folderSearch.value);
});

document.addEventListener("click", (e) => {
  if (!els.folderPicker.contains(e.target) && !els.folderPanel.hidden) {
    closeFolderPanel();
  }
});

els.reminderEnabled.addEventListener("change", () => {
  els.reminderFields.hidden = !els.reminderEnabled.checked;
});

els.cancelBtn.addEventListener("click", () => window.close());

els.saveBtn.addEventListener("click", async () => {
  if (!pageState) return;

  els.saveBtn.disabled = true;
  els.errorText.hidden = true;

  try {
    let bookmarkId = pageState.id;
    let bookmarkTitle = pageState.title;
    const bookmarkUrl = pageState.url;

    if (!pageState.isBookmarked) {
      const title = els.bookmarkTitleInput.value.trim() || pageState.title;
      const parentId = els.folderSelect.value || "1";
      const created = await chrome.bookmarks.create({
        parentId,
        title,
        url: bookmarkUrl,
      });
      bookmarkId = created.id;
      bookmarkTitle = created.title;
    }

    if (els.reminderEnabled.checked) {
      const [year, month, day] = els.reminderDate.value.split("-").map(Number);
      const [hour, minute] = els.reminderTime.value.split(":").map(Number);
      const reminderAt = new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
      if (!Number.isFinite(reminderAt)) throw new Error("Invalid date/time");

      await chrome.runtime.sendMessage({
        type: "NEXX_ADD_REMINDER",
        payload: {
          bookmarkId,
          bookmarkTitle,
          bookmarkUrl,
          note: els.reminderNote.value.trim() || undefined,
          reminderAt,
          dateOnly: false,
          priority: "medium",
          repeat: { type: "none" },
        },
      });
    }

    window.close();
  } catch (error) {
    console.error(error);
    els.errorText.textContent = String(error?.message || error);
    els.errorText.hidden = false;
    els.saveBtn.disabled = false;
  }
});

const init = async () => {
  setDefaultDateTime();
  els.reminderEnabled.checked = true;
  els.reminderFields.hidden = false;

  const tab = await getActiveTab();
  if (!tab) {
    els.errorText.textContent = t.loadError;
    els.errorText.hidden = false;
    els.saveBtn.disabled = true;
    return;
  }

  const url = tab.url || "";
  const title = tab.title || url;

  if (!isBookmarkableUrl(url)) {
    els.errorText.textContent = t.unsupported;
    els.errorText.hidden = false;
    els.saveBtn.disabled = true;
    return;
  }

  const existing = await findBookmarkByUrl(url);

  if (existing) {
    pageState = {
      id: existing.id,
      title: existing.title || title,
      url: existing.url || url,
      isBookmarked: true,
    };

    els.popupTitle.textContent = t.titleExisting;
    els.statusText.textContent = t.alreadyBookmarked;
    els.statusText.hidden = false;
    els.existingSection.hidden = false;
    els.bookmarkSection.hidden = true;
    els.existingTitle.textContent = pageState.title;
    els.existingUrl.textContent = pageState.url;

    const reminder = await loadExistingReminder(existing.id, pageState.url);
    applyExistingReminder(reminder);
    return;
  }

  pageState = {
    title,
    url,
    isBookmarked: false,
  };

  els.popupTitle.textContent = t.titleNew;
  els.bookmarkSection.hidden = false;
  els.existingSection.hidden = true;
  els.bookmarkTitleInput.value = title;
  els.pageUrl.textContent = url;

  folderRoots = await loadFolderTree();
  selectedFolderId = folderRoots.some((f) => f.id === "1") ? "1" : folderRoots[0]?.id || "1";
  expandedIds = new Set(folderRoots.map((f) => f.id));
  updateTriggerLabel();
  renderFolderTree("");
};

init().catch((error) => {
  console.error(error);
  els.errorText.textContent = t.loadError;
  els.errorText.hidden = false;
  els.saveBtn.disabled = true;
});
