const USERS_KEY = "kharcha-tracker-users-v1";
const SESSION_KEY = "kharcha-tracker-session-v1";
const BACKUP_KEY = "kharcha-tracker-backups-v1";
const CRASH_LOG_KEY = "kharcha-tracker-crash-log-v1";
const APP_VERSION = "1.1.0";
const DEFAULT_BUDGET = 35000;
const MAX_BACKUPS = 8;
const MAX_CRASH_LOGS = 20;
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const categories = {
  expense: ["Food", "Transport", "Rent", "Shopping", "Bills", "Health", "Entertainment", "Travel", "Education", "Other"],
  income: ["Salary", "Freelance", "Business", "Investment", "Gift", "Refund", "Other"],
};

const demoTransactions = [
  { id: createId(), type: "income", title: "Monthly Salary", amount: 68000, category: "Salary", paymentMode: "Bank Transfer", date: "2026-03-01", note: "Primary salary credit" },
  { id: createId(), type: "expense", title: "Apartment Rent", amount: 18000, category: "Rent", paymentMode: "Bank Transfer", date: "2026-03-03", note: "Monthly rent" },
  { id: createId(), type: "expense", title: "Groceries", amount: 4200, category: "Food", paymentMode: "UPI", date: "2026-03-08", note: "Weekly household shopping" },
  { id: createId(), type: "expense", title: "Weekend Dinner", amount: 1850, category: "Entertainment", paymentMode: "Card", date: "2026-03-10", note: "Dinner with friends" },
  { id: createId(), type: "income", title: "Freelance Payment", amount: 12500, category: "Freelance", paymentMode: "Bank Transfer", date: "2026-03-14", note: "Landing page project" },
  { id: createId(), type: "expense", title: "Electricity Bill", amount: 2600, category: "Bills", paymentMode: "UPI", date: "2026-03-18", note: "Monthly electricity bill" },
];

const state = {
  authMode: "signup",
  currentUser: null,
  tracker: createEmptyTrackerState(),
  runtimeHealthy: true,
  runtimeMessage: "All systems normal.",
};

const elements = {
  authShell: document.querySelector("#authShell"),
  appShell: document.querySelector("#appShell"),
  authForm: document.querySelector("#authForm"),
  authName: document.querySelector("#authName"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authHeading: document.querySelector("#authHeading"),
  authSubtext: document.querySelector("#authSubtext"),
  authSubmit: document.querySelector("#authSubmit"),
  authMessage: document.querySelector("#authMessage"),
  nameField: document.querySelector("#nameField"),
  authSegments: document.querySelectorAll(".auth-segment"),
  currentUserName: document.querySelector("#currentUserName"),
  logoutButton: document.querySelector("#logoutButton"),
  transactionForm: document.querySelector("#transactionForm"),
  title: document.querySelector("#title"),
  amount: document.querySelector("#amount"),
  date: document.querySelector("#date"),
  category: document.querySelector("#category"),
  paymentMode: document.querySelector("#paymentMode"),
  note: document.querySelector("#note"),
  budgetInput: document.querySelector("#budgetInput"),
  budgetValue: document.querySelector("#budgetValue"),
  heroBalance: document.querySelector("#heroBalance"),
  heroSpend: document.querySelector("#heroSpend"),
  totalBalance: document.querySelector("#totalBalance"),
  totalIncome: document.querySelector("#totalIncome"),
  totalExpense: document.querySelector("#totalExpense"),
  savingsRate: document.querySelector("#savingsRate"),
  budgetPercent: document.querySelector("#budgetPercent"),
  budgetRing: document.querySelector("#budgetRing"),
  budgetStatus: document.querySelector("#budgetStatus"),
  budgetMessage: document.querySelector("#budgetMessage"),
  topCategory: document.querySelector("#topCategory"),
  largestTransaction: document.querySelector("#largestTransaction"),
  transactionCount: document.querySelector("#transactionCount"),
  categoryBars: document.querySelector("#categoryBars"),
  transactionList: document.querySelector("#transactionList"),
  adviceList: document.querySelector("#adviceList"),
  filterType: document.querySelector("#filterType"),
  filterCategory: document.querySelector("#filterCategory"),
  transactionTemplate: document.querySelector("#transactionTemplate"),
  loadDemo: document.querySelector("#loadDemo"),
  segments: document.querySelectorAll(".segment"),
  runtimeBanner: document.querySelector("#runtimeBanner"),
  runtimeBannerText: document.querySelector("#runtimeBannerText"),
  dismissBannerButton: document.querySelector("#dismissBannerButton"),
  restoreBackupButton: document.querySelector("#restoreBackupButton"),
  healthStatus: document.querySelector("#healthStatus"),
  lastBackupAt: document.querySelector("#lastBackupAt"),
  errorCount: document.querySelector("#errorCount"),
  healthDescription: document.querySelector("#healthDescription"),
  exportBackupButton: document.querySelector("#exportBackupButton"),
  importBackupButton: document.querySelector("#importBackupButton"),
  importBackupInput: document.querySelector("#importBackupInput"),
  clearCrashLogButton: document.querySelector("#clearCrashLogButton"),
  resetAppButton: document.querySelector("#resetAppButton"),
  recoveryMessage: document.querySelector("#recoveryMessage"),
};

initialize();

function initialize() {
  try {
    setupGlobalErrorHandling();
    bindEvents();
    restoreSession();
    updateAuthUI();
    updateAppVisibility();
    renderReliabilityPanel();
    createBackup("app-opened");
  } catch (error) {
    reportRuntimeIssue(error, "initialize", {
      userVisibleMessage: "App start karte waqt issue aaya. Recovery tools use karke latest backup restore kiya ja sakta hai.",
    });
  }
}

function bindEvents() {
  elements.authForm.addEventListener("submit", withRuntimeGuard("auth-submit", handleAuthSubmit));
  elements.logoutButton.addEventListener("click", withRuntimeGuard("logout", logout));
  elements.transactionForm.addEventListener("submit", withRuntimeGuard("transaction-submit", handleSubmit));
  elements.filterType.addEventListener("change", withRuntimeGuard("filter-change", handleFilterChange));
  elements.filterCategory.addEventListener("change", withRuntimeGuard("filter-category-change", renderTransactions));
  elements.loadDemo.addEventListener("click", withRuntimeGuard("load-demo", loadDemoData));
  elements.restoreBackupButton.addEventListener("click", withRuntimeGuard("restore-backup-banner", () => restoreLatestBackup(true)));
  elements.dismissBannerButton.addEventListener("click", hideRuntimeBanner);
  elements.exportBackupButton.addEventListener("click", withRuntimeGuard("export-backup", exportLatestBackup));
  elements.importBackupButton.addEventListener("click", () => elements.importBackupInput.click());
  elements.importBackupInput.addEventListener("change", withRuntimeGuard("import-backup", handleImportBackup));
  elements.clearCrashLogButton.addEventListener("click", withRuntimeGuard("clear-crash-log", clearCrashLog));
  elements.resetAppButton.addEventListener("click", withRuntimeGuard("reset-current-user", resetCurrentUserData));

  elements.authSegments.forEach((button) => {
    button.addEventListener("click", () => {
      state.authMode = button.dataset.authMode;
      setAuthMessage("");
      updateAuthUI();
    });
  });

  elements.segments.forEach((button) => {
    button.addEventListener("click", () => {
      state.tracker.formType = button.dataset.type;
      persistCurrentUserState("form-type-updated");
      updateSegments();
      populateCategorySelect();
    });
  });
}

function setupGlobalErrorHandling() {
  window.addEventListener("error", (event) => {
    reportRuntimeIssue(event.error || new Error(event.message || "Unknown runtime error"), "window-error", {
      userVisibleMessage: "Browser-side crash detect hua. Latest backup restore karke recent data wapas laya ja sakta hai.",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason || "Unhandled promise rejection"));
    reportRuntimeIssue(reason, "unhandled-rejection", {
      userVisibleMessage: "Background operation fail hua. Health panel me recovery options available hain.",
    });
  });
}

function withRuntimeGuard(label, callback) {
  return (event) => {
    try {
      callback(event);
    } catch (error) {
      reportRuntimeIssue(error, label, {
        userVisibleMessage: "Ek unexpected issue aaya. App ne details save kar li hain aur recovery options ready hain.",
      });
    }
  };
}

function handleAuthSubmit(event) {
  event.preventDefault();

  const name = elements.authName.value.trim();
  const email = elements.authEmail.value.trim().toLowerCase();
  const password = elements.authPassword.value;
  const users = loadUsers();

  if (!email || !password) {
    setAuthMessage("Email aur password required hai.", "error");
    return;
  }

  if (state.authMode === "signup") {
    if (!name) {
      setAuthMessage("Account create karne ke liye naam required hai.", "error");
      return;
    }

    if (password.length < 6) {
      setAuthMessage("Password kam se kam 6 characters ka hona chahiye.", "error");
      return;
    }

    if (users[email]) {
      setAuthMessage("Is email se account already bana hua hai. Login use karo.", "error");
      return;
    }

    users[email] = {
      name,
      email,
      password,
      tracker: createEmptyTrackerState(),
    };
    saveUsers(users);
    createBackup("account-created", email);
    setAuthMessage("Account create ho gaya. Aap ab login ho gaye ho.", "success");
    loginUser(email);
    return;
  }

  const user = users[email];
  if (!user || user.password !== password) {
    setAuthMessage("Invalid email ya password.", "error");
    return;
  }

  setAuthMessage("");
  loginUser(email);
}

function loginUser(email) {
  const users = loadUsers();
  const user = users[email];
  if (!user) {
    return;
  }

  state.currentUser = {
    email: user.email,
    name: user.name,
  };
  state.tracker = normalizeTrackerState(user.tracker);

  safeStorageSetItem(SESSION_KEY, email);
  elements.authForm.reset();
  elements.filterType.value = "all";
  elements.filterCategory.value = "all";
  initializeTrackerUI();
  updateAppVisibility();
  renderReliabilityPanel();
}

function logout() {
  persistCurrentUserState("logout");
  state.currentUser = null;
  state.tracker = createEmptyTrackerState();
  localStorage.removeItem(SESSION_KEY);
  elements.authPassword.value = "";
  elements.authEmail.value = "";
  elements.currentUserName.textContent = "Guest";
  setAuthMessage("Login karke apna tracker access karo.", "success");
  updateAppVisibility();
  updateAuthUI();
  renderReliabilityPanel();
}

function restoreSession() {
  const email = safeStorageGetItem(SESSION_KEY);
  if (!email) {
    return;
  }

  const users = loadUsers();
  if (!users[email]) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  state.authMode = "login";
  loginUser(email);
}

function initializeTrackerUI() {
  elements.date.value = getTodayLocal();
  elements.budgetInput.value = state.tracker.budget;
  elements.currentUserName.textContent = state.currentUser.name;
  updateSegments();
  populateCategorySelect();
  populateFilterCategories();
  render();
}

function updateAppVisibility() {
  const isLoggedIn = Boolean(state.currentUser);
  elements.authShell.classList.toggle("hidden", isLoggedIn);
  elements.appShell.classList.toggle("hidden", !isLoggedIn);
}

function updateAuthUI() {
  const isSignup = state.authMode === "signup";
  elements.nameField.classList.toggle("hidden", !isSignup);
  elements.authHeading.textContent = isSignup ? "Create your account" : "Login to your account";
  elements.authSubtext.textContent = isSignup
    ? "Set your name, email, and password to unlock your tracker."
    : "Use your registered email and password to open your dashboard.";
  elements.authSubmit.textContent = isSignup ? "Create account" : "Login";

  elements.authSegments.forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === state.authMode);
  });
}

function handleSubmit(event) {
  event.preventDefault();

  const title = elements.title.value.trim();
  const amount = Number(elements.amount.value);
  const date = elements.date.value;
  const category = elements.category.value;
  const paymentMode = elements.paymentMode.value;
  const note = elements.note.value.trim();
  const budget = Number(elements.budgetInput.value) || DEFAULT_BUDGET;

  if (!title || !amount || !date || !category) {
    return;
  }

  state.tracker.transactions.unshift({
    id: createId(),
    type: state.tracker.formType,
    title,
    amount,
    category,
    paymentMode,
    date,
    note,
  });

  state.tracker.budget = budget;
  persistCurrentUserState("transaction-saved");
  elements.transactionForm.reset();
  elements.date.value = getTodayLocal();
  elements.budgetInput.value = state.tracker.budget;
  populateCategorySelect();
  populateFilterCategories();
  render();
}

function handleFilterChange() {
  populateFilterCategories();
  renderTransactions();
}

function loadDemoData() {
  state.tracker.transactions = cloneDemoTransactions();
  state.tracker.budget = DEFAULT_BUDGET;
  state.tracker.formType = "expense";
  elements.budgetInput.value = state.tracker.budget;
  updateSegments();
  populateCategorySelect();
  populateFilterCategories();
  persistCurrentUserState("demo-loaded");
  render();
}

function populateCategorySelect() {
  const activeCategories = categories[state.tracker.formType];
  elements.category.innerHTML = activeCategories
    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
    .join("");
}

function populateFilterCategories() {
  const selectedType = elements.filterType.value;
  const available = new Set(["all"]);

  state.tracker.transactions.forEach((transaction) => {
    if (selectedType === "all" || transaction.type === selectedType) {
      available.add(transaction.category);
    }
  });

  const previousValue = elements.filterCategory.value;
  elements.filterCategory.innerHTML = [...available]
    .map((item) => `<option value="${escapeHtml(item)}">${item === "all" ? "All categories" : escapeHtml(item)}</option>`)
    .join("");
  elements.filterCategory.value = available.has(previousValue) ? previousValue : "all";
}

function render() {
  updateSegments();
  populateFilterCategories();
  renderSummary();
  renderBars();
  renderTransactions();
  renderAdvice();
  renderReliabilityPanel();
}

function renderSummary() {
  const totals = getTotals();
  const expenseRatio = state.tracker.budget ? Math.min(totals.expense / state.tracker.budget, 1.2) : 0;
  const percentage = Math.round(expenseRatio * 100);
  const ringLength = 301.59;
  const dashOffset = ringLength * (1 - Math.min(expenseRatio, 1));
  const savingsRate = totals.income ? Math.max(0, Math.round((totals.balance / totals.income) * 100)) : 0;
  const topCategory = getTopCategory();
  const largestTransaction = [...state.tracker.transactions].sort((a, b) => b.amount - a.amount)[0];

  elements.budgetValue.textContent = formatCurrency(state.tracker.budget);
  elements.heroBalance.textContent = formatCurrency(totals.balance);
  elements.heroSpend.textContent = formatCurrency(totals.expense);
  elements.totalBalance.textContent = formatCurrency(totals.balance);
  elements.totalIncome.textContent = formatCurrency(totals.income);
  elements.totalExpense.textContent = formatCurrency(totals.expense);
  elements.savingsRate.textContent = `${savingsRate}%`;
  elements.budgetPercent.textContent = `${percentage}%`;
  elements.budgetRing.style.strokeDashoffset = `${dashOffset}`;
  elements.topCategory.textContent = topCategory ? `${topCategory.category} (${formatCurrency(topCategory.amount)})` : "None yet";
  elements.largestTransaction.textContent = largestTransaction ? `${largestTransaction.title} (${formatCurrency(largestTransaction.amount)})` : "Rs 0";
  elements.transactionCount.textContent = `${state.tracker.transactions.length} record${state.tracker.transactions.length === 1 ? "" : "s"}`;

  if (expenseRatio < 0.6) {
    elements.budgetStatus.textContent = "Budget is under control.";
    elements.budgetMessage.textContent = "Spending is comfortably below your monthly limit.";
    elements.budgetRing.style.stroke = "#9ed9b8";
  } else if (expenseRatio < 1) {
    elements.budgetStatus.textContent = "Budget is getting tight.";
    elements.budgetMessage.textContent = "Keep an eye on upcoming discretionary spending.";
    elements.budgetRing.style.stroke = "#f4d5b2";
  } else {
    elements.budgetStatus.textContent = "Budget limit crossed.";
    elements.budgetMessage.textContent = "Review your recent transactions and reduce non-essential costs.";
    elements.budgetRing.style.stroke = "#ff9f8f";
  }
}

function renderBars() {
  const expensesByCategory = state.tracker.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((accumulator, transaction) => {
      accumulator[transaction.category] = (accumulator[transaction.category] || 0) + transaction.amount;
      return accumulator;
    }, {});

  const sorted = Object.entries(expensesByCategory).sort((left, right) => right[1] - left[1]).slice(0, 5);

  if (!sorted.length) {
    elements.categoryBars.innerHTML = '<div class="empty-state">No expense data yet. Add some transactions to unlock analytics.</div>';
    return;
  }

  const maxAmount = sorted[0][1];
  elements.categoryBars.innerHTML = sorted.map(([name, amount]) => {
    const width = Math.max(12, Math.round((amount / maxAmount) * 100));
    return `
      <div class="bar-row">
        <strong>${escapeHtml(name)}</strong>
        <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
        <span>${formatCurrency(amount)}</span>
      </div>
    `;
  }).join("");
}

function renderTransactions() {
  const filtered = getFilteredTransactions();

  if (!filtered.length) {
    elements.transactionList.innerHTML = '<div class="empty-state">No matching transactions found.</div>';
    return;
  }

  elements.transactionList.innerHTML = "";

  filtered.forEach((transaction) => {
    const fragment = elements.transactionTemplate.content.cloneNode(true);
    const badge = fragment.querySelector(".transaction-badge");
    const amount = fragment.querySelector(".transaction-amount");

    fragment.querySelector(".transaction-title").textContent = transaction.title;
    badge.textContent = transaction.type;
    badge.classList.add(transaction.type);
    fragment.querySelector(".transaction-meta").textContent = `${formatDate(transaction.date)} | ${transaction.category} | ${transaction.paymentMode}`;
    fragment.querySelector(".transaction-note").textContent = transaction.note || "No extra note";
    amount.textContent = `${transaction.type === "expense" ? "-" : "+"}${formatCurrency(transaction.amount)}`;
    amount.style.color = transaction.type === "expense" ? "var(--expense)" : "var(--income)";

    fragment.querySelector(".delete-button").addEventListener("click", withRuntimeGuard("delete-transaction", () => {
      state.tracker.transactions = state.tracker.transactions.filter((itemRecord) => itemRecord.id !== transaction.id);
      persistCurrentUserState("transaction-deleted");
      populateFilterCategories();
      render();
    }));

    elements.transactionList.appendChild(fragment);
  });
}

function renderAdvice() {
  const totals = getTotals();
  const topCategory = getTopCategory();
  const advice = [];

  if (!state.tracker.transactions.length) {
    advice.push({
      title: "Start with your first week",
      description: "Add salary, rent, food, and travel entries first. Early patterns make the dashboard useful quickly.",
    });
  } else {
    advice.push({
      title: totals.balance >= 0 ? "Cashflow is positive" : "Cashflow needs correction",
      description: totals.balance >= 0
        ? `You currently retain ${formatCurrency(totals.balance)} after expenses. Keep high-value spending intentional.`
        : `You are overspending by ${formatCurrency(Math.abs(totals.balance))}. Reduce flexible categories first.`,
    });
  }

  advice.push({
    title: topCategory ? `${topCategory.category} is your biggest expense lane` : "No dominant category yet",
    description: topCategory
      ? `This category has consumed ${formatCurrency(topCategory.amount)}. Review whether recurring costs can be lowered.`
      : "Once a few expenses are logged, category pressure analysis will appear here.",
  });

  advice.push({
    title: `Monthly budget: ${formatCurrency(state.tracker.budget)}`,
    description: totals.expense > state.tracker.budget
      ? "Current expenses are above budget. Freeze optional spend until next income cycle."
      : `You still have ${formatCurrency(Math.max(state.tracker.budget - totals.expense, 0))} available before crossing the budget line.`,
  });

  elements.adviceList.innerHTML = advice.map((item) => `
    <article class="advice-item">
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join("");
}

function updateSegments() {
  elements.segments.forEach((button) => {
    button.classList.toggle("active", button.dataset.type === state.tracker.formType);
  });
}

function getTotals() {
  return state.tracker.transactions.reduce((accumulator, transaction) => {
    if (transaction.type === "income") {
      accumulator.income += transaction.amount;
    } else {
      accumulator.expense += transaction.amount;
    }
    accumulator.balance = accumulator.income - accumulator.expense;
    return accumulator;
  }, { income: 0, expense: 0, balance: 0 });
}

function getTopCategory() {
  const totalsByCategory = state.tracker.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((accumulator, transaction) => {
      accumulator[transaction.category] = (accumulator[transaction.category] || 0) + transaction.amount;
      return accumulator;
    }, {});

  const [category, amount] = Object.entries(totalsByCategory).sort((left, right) => right[1] - left[1])[0] || [];
  return category ? { category, amount } : null;
}

function getFilteredTransactions() {
  return state.tracker.transactions.filter((transaction) => {
    const typeMatches = elements.filterType.value === "all" || transaction.type === elements.filterType.value;
    const categoryMatches = elements.filterCategory.value === "all" || transaction.category === elements.filterCategory.value;
    return typeMatches && categoryMatches;
  });
}

function renderReliabilityPanel() {
  const backups = loadBackups();
  const crashLogs = loadCrashLogs();
  const latestBackup = backups[0];

  elements.healthStatus.textContent = state.runtimeHealthy ? "Healthy" : "Recovery mode";
  elements.lastBackupAt.textContent = latestBackup ? formatDateTime(latestBackup.createdAt) : "Not created yet";
  elements.errorCount.textContent = `${crashLogs.length} entr${crashLogs.length === 1 ? "y" : "ies"}`;

  if (state.runtimeHealthy) {
    elements.healthDescription.textContent = latestBackup
      ? `Local recovery snapshots active. Latest backup ${formatRelativeDate(latestBackup.createdAt)} create hua tha.`
      : "The app keeps local recovery snapshots in your browser so recent data can be restored if storage gets corrupted.";
  } else {
    elements.healthDescription.textContent = state.runtimeMessage;
  }
}

function loadUsers() {
  try {
    const raw = safeStorageGetItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    const recoveredUsers = getUsersFromLatestBackup();
    if (recoveredUsers) {
      saveUsers(recoveredUsers);
      state.runtimeHealthy = false;
      state.runtimeMessage = "Saved user data corrupt ho gaya tha. Latest backup se restore kar diya gaya hai.";
      showRuntimeBanner(state.runtimeMessage);
      renderReliabilityPanel();
      return recoveredUsers;
    }

    reportRuntimeIssue(error, "load-users", {
      userVisibleMessage: "Stored data read nahi ho paya. Agar backup available ho to restore button use karein.",
    });
    return {};
  }
}

function saveUsers(users) {
  safeStorageSetItem(USERS_KEY, JSON.stringify(users));
}

function persistCurrentUserState(reason = "auto-save") {
  if (!state.currentUser) {
    return;
  }

  const users = loadUsers();
  const existingUser = users[state.currentUser.email];
  if (!existingUser) {
    return;
  }

  users[state.currentUser.email] = {
    ...existingUser,
    tracker: state.tracker,
  };
  saveUsers(users);
  createBackup(reason, state.currentUser.email);
  renderReliabilityPanel();
}

function normalizeTrackerState(value) {
  return {
    budget: value?.budget || DEFAULT_BUDGET,
    formType: value?.formType === "income" ? "income" : "expense",
    transactions: Array.isArray(value?.transactions) ? value.transactions : [],
  };
}

function createEmptyTrackerState() {
  return {
    budget: DEFAULT_BUDGET,
    formType: "expense",
    transactions: [],
  };
}

function setAuthMessage(message, type = "") {
  elements.authMessage.textContent = message;
  elements.authMessage.className = `auth-message${type ? ` ${type}` : ""}`;
}

function setRecoveryMessage(message, type = "") {
  elements.recoveryMessage.textContent = message;
  elements.recoveryMessage.className = `auth-message${type ? ` ${type}` : ""}`;
}

function showRuntimeBanner(message) {
  elements.runtimeBannerText.textContent = message;
  elements.runtimeBanner.classList.remove("hidden");
}

function hideRuntimeBanner() {
  elements.runtimeBanner.classList.add("hidden");
}

function safeStorageGetItem(key) {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSetItem(key, value) {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (key === CRASH_LOG_KEY) {
      console.error("[storage-set-crash-log]", error);
      return;
    }

    reportRuntimeIssue(error, `storage-set-${key}`, {
      userVisibleMessage: "Browser storage me data save nahi ho paya. Export backup karke data secure kar lena better rahega.",
    });
  }
}

function isStorageAvailable() {
  try {
    const probeKey = "__kharcha_probe__";
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

function createBackup(reason = "manual", preferredSessionEmail = state.currentUser?.email || "") {
  if (!isStorageAvailable()) {
    return;
  }

  const users = loadUsers();
  const existingBackups = loadBackups();
  const nextBackup = {
    id: createId(),
    reason,
    appVersion: APP_VERSION,
    createdAt: new Date().toISOString(),
    sessionEmail: preferredSessionEmail || safeStorageGetItem(SESSION_KEY) || "",
    users,
  };

  safeStorageSetItem(BACKUP_KEY, JSON.stringify([nextBackup, ...existingBackups].slice(0, MAX_BACKUPS)));
}

function loadBackups() {
  const raw = safeStorageGetItem(BACKUP_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => isObject(item) && isObject(item.users)) : [];
  } catch {
    return [];
  }
}

function getUsersFromLatestBackup() {
  const latest = loadBackups()[0];
  return latest && isObject(latest.users) ? latest.users : null;
}

function restoreLatestBackup(fromBanner = false) {
  const latest = loadBackups()[0];
  if (!latest) {
    setRecoveryMessage("Abhi tak koi backup available nahi hai.", "error");
    return;
  }

  const shouldRestore = window.confirm(`Latest backup ${formatDateTime(latest.createdAt)} ka hai. Kya aap usse restore karna chahte ho?`);
  if (!shouldRestore) {
    return;
  }

  saveUsers(latest.users);
  if (latest.sessionEmail) {
    safeStorageSetItem(SESSION_KEY, latest.sessionEmail);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }

  state.runtimeHealthy = true;
  state.runtimeMessage = "Latest backup successfully restore ho gaya.";
  hideRuntimeBanner();
  setRecoveryMessage("Latest backup restore ho gaya.", "success");
  rehydrateApp();

  if (fromBanner) {
    showRuntimeBanner("Latest backup restore ho gaya. App normal mode me wapas aa gaya hai.");
  }
}

function exportLatestBackup() {
  const latest = loadBackups()[0];
  if (!latest) {
    setRecoveryMessage("Export karne ke liye backup available nahi hai.", "error");
    return;
  }

  const blob = new Blob([JSON.stringify(latest, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kharcha-tracker-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setRecoveryMessage("Latest backup export ho gaya.", "success");
}

function handleImportBackup(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      if (!isObject(parsed) || !isObject(parsed.users)) {
        throw new Error("Invalid backup file.");
      }

      saveUsers(parsed.users);
      if (typeof parsed.sessionEmail === "string" && parsed.sessionEmail) {
        safeStorageSetItem(SESSION_KEY, parsed.sessionEmail);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
      createBackup("backup-imported", parsed.sessionEmail || "");
      state.runtimeHealthy = true;
      state.runtimeMessage = "Imported backup restore ho gaya.";
      setRecoveryMessage("Backup file import ho gayi.", "success");
      rehydrateApp();
    } catch (error) {
      reportRuntimeIssue(error, "import-backup", {
        userVisibleMessage: "Backup file valid nahi thi. Sahi JSON backup file try karo.",
      });
      setRecoveryMessage("Backup file valid nahi thi.", "error");
    } finally {
      elements.importBackupInput.value = "";
    }
  };
  reader.readAsText(file);
}

function clearCrashLog() {
  safeStorageSetItem(CRASH_LOG_KEY, JSON.stringify([]));
  state.runtimeHealthy = true;
  state.runtimeMessage = "Crash logs clear ho gaye. Monitoring active hai.";
  hideRuntimeBanner();
  setRecoveryMessage("Crash logs clear ho gaye.", "success");
  renderReliabilityPanel();
}

function resetCurrentUserData() {
  if (!state.currentUser) {
    setRecoveryMessage("Reset ke liye pehle login karo.", "error");
    return;
  }

  const shouldReset = window.confirm("Current user ka tracker data reset ho jayega. Account rahega, transactions clear ho jayengi. Continue?");
  if (!shouldReset) {
    return;
  }

  state.tracker = createEmptyTrackerState();
  persistCurrentUserState("tracker-reset");
  initializeTrackerUI();
  setRecoveryMessage("Current user ka tracker reset ho gaya.", "success");
  hideRuntimeBanner();
}

function rehydrateApp() {
  state.currentUser = null;
  state.tracker = createEmptyTrackerState();
  restoreSession();
  updateAuthUI();
  updateAppVisibility();
  if (state.currentUser) {
    initializeTrackerUI();
  }
  renderReliabilityPanel();
}

function loadCrashLogs() {
  const raw = safeStorageGetItem(CRASH_LOG_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isObject) : [];
  } catch {
    return [];
  }
}

function reportRuntimeIssue(error, context, options = {}) {
  try {
    const crashLogs = loadCrashLogs();
    const entry = {
      id: createId(),
      context,
      message: error?.message || "Unknown error",
      stack: error?.stack || "",
      time: new Date().toISOString(),
    };

    safeStorageSetItem(CRASH_LOG_KEY, JSON.stringify([entry, ...crashLogs].slice(0, MAX_CRASH_LOGS)));
    state.runtimeHealthy = false;
    state.runtimeMessage = options.userVisibleMessage || "Runtime issue detect hua. Recovery options ready hain.";
    showRuntimeBanner(state.runtimeMessage);
    renderReliabilityPanel();
  } catch {
    showRuntimeBanner("Runtime issue detect hua, lekin log save nahi ho paya.");
  }

  console.error(`[${context}]`, error);
}

function cloneDemoTransactions() {
  if (typeof structuredClone === "function") {
    return structuredClone(demoTransactions);
  }

  return JSON.parse(JSON.stringify(demoTransactions));
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCurrency(amount) {
  return CURRENCY_FORMATTER.format(amount);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeDate(value) {
  const now = Date.now();
  const diffMs = now - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} pehle`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} pehle`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} pehle`;
}

function getTodayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
