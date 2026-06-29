(() => {
  const API_URL = "/api/contact-leads";
  const TOKEN_KEY = "deeprank-admin-token";

  const statusLabels = {
    new: "未处理",
    contacted: "已联系",
    closed: "已完成",
  };

  const tokenPanel = document.querySelector("[data-token-panel]");
  const leadsPanel = document.querySelector("[data-leads-panel]");
  const tokenForm = document.querySelector("[data-token-form]");
  const statusFilter = document.querySelector("[data-status-filter]");
  const leadsBody = document.querySelector("[data-leads-body]");
  const message = document.querySelector("[data-admin-message]");
  const totalCount = document.querySelector("[data-total-count]");
  const refreshButton = document.querySelector("[data-refresh]");
  const logoutButton = document.querySelector("[data-logout]");

  let adminToken = "";

  function setMessage(text, state = "") {
    if (!message) return;
    message.textContent = text;
    message.dataset.state = state;
  }

  function setPanels(isAuthed) {
    document.body.classList.toggle("is-authed", isAuthed);
    if (tokenPanel) tokenPanel.hidden = isAuthed;
    if (leadsPanel) leadsPanel.hidden = !isAuthed;
  }

  function authHeaders() {
    return {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    };
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("zh-CN", { hour12: false });
  }

  function textCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value || "-";
    return cell;
  }

  function createStatusSelect(value) {
    const select = document.createElement("select");
    Object.entries(statusLabels).forEach(([status, label]) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = label;
      option.selected = status === value;
      select.append(option);
    });
    return select;
  }

  function renderLeads(leads) {
    if (!leadsBody) return;
    leadsBody.textContent = "";
    if (totalCount) totalCount.textContent = `共 ${leads.length} 条`;

    if (leads.length === 0) {
      const row = document.createElement("tr");
      row.className = "empty-row";
      const cell = document.createElement("td");
      cell.colSpan = 8;
      cell.textContent = "暂无咨询记录";
      row.append(cell);
      leadsBody.append(row);
      return;
    }

    leads.forEach((lead) => {
      const row = document.createElement("tr");
      row.className = "lead-row";

      row.append(textCell(formatDate(lead.created_at)));
      row.append(textCell(lead.email));
      row.append(textCell(lead.name_company));
      row.append(textCell(lead.project_type));

      const messageCell = document.createElement("td");
      const messageText = document.createElement("div");
      messageText.className = "lead-message";
      messageText.textContent = lead.message || "-";
      messageCell.append(messageText);
      row.append(messageCell);

      const statusCell = document.createElement("td");
      const statusSelect = createStatusSelect(lead.status);
      statusCell.append(statusSelect);
      row.append(statusCell);

      const remarkCell = document.createElement("td");
      const remarkInput = document.createElement("textarea");
      remarkInput.placeholder = "填写后台备注";
      remarkInput.value = lead.remark || "";
      remarkCell.append(remarkInput);
      row.append(remarkCell);

      const actionCell = document.createElement("td");
      const saveButton = document.createElement("button");
      saveButton.className = "admin-button";
      saveButton.type = "button";
      saveButton.textContent = "保存";
      saveButton.addEventListener("click", () => updateLead(lead.id, statusSelect.value, remarkInput.value, saveButton));
      actionCell.append(saveButton);
      row.append(actionCell);

      leadsBody.append(row);
    });
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    let payload = null;

    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.error || "请求失败，请稍后重试。");
    }

    return payload;
  }

  async function loadLeads() {
    if (!adminToken) return;
    setMessage("正在加载...");

    const status = statusFilter?.value || "all";
    const url = status === "all" ? API_URL : `${API_URL}?status=${encodeURIComponent(status)}`;

    try {
      const payload = await requestJson(url, { headers: authHeaders() });
      renderLeads(payload.leads || []);
      setMessage("列表已更新。", "success");
    } catch (error) {
      renderLeads([]);
      setMessage(error.message, "error");
    }
  }

  async function updateLead(id, status, remark, button) {
    button.disabled = true;
    button.textContent = "保存中...";
    setMessage("");

    try {
      await requestJson(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status, remark }),
      });
      setMessage("已保存。", "success");
      await loadLeads();
    } catch (error) {
      setMessage(error.message, "error");
    } finally {
      button.disabled = false;
      button.textContent = "保存";
    }
  }

  tokenForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(tokenForm);
    adminToken = String(formData.get("token") || "").trim();
    if (!adminToken) return;

    try {
      sessionStorage.setItem(TOKEN_KEY, adminToken);
    } catch (error) {
      // Session storage is a convenience only; the current page can still proceed.
    }

    setPanels(true);
    await loadLeads();
  });

  statusFilter?.addEventListener("change", loadLeads);
  refreshButton?.addEventListener("click", loadLeads);
  logoutButton?.addEventListener("click", () => {
    adminToken = "";
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      // Ignore storage cleanup failures.
    }
    setPanels(false);
    setMessage("");
  });

  try {
    adminToken = sessionStorage.getItem(TOKEN_KEY) || "";
  } catch (error) {
    adminToken = "";
  }

  setPanels(Boolean(adminToken));
  if (adminToken) loadLeads();
})();
