/**
 * MathMaster 12 - Client Logic & LaTeX Integration
 */

(function () {
  'use strict';

  // State
  let sessions = [];
  let currentSessionId = null;
  let attachedImage = null; // { dataUrl, name }
  let isGenerating = false;

  // DOM Elements
  const chatContainer = document.getElementById('chatContainer');
  const messagesFeed = document.getElementById('messagesFeed');
  const welcomeHero = document.getElementById('welcomeHero');
  const chatForm = document.getElementById('chatForm');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const imageInput = document.getElementById('imageInput');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreviewImg = document.getElementById('imagePreviewImg');
  const imageFileName = document.getElementById('imageFileName');
  const removeImgBtn = document.getElementById('removeImgBtn');
  const solveModeSelect = document.getElementById('solveModeSelect');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const historyList = document.getElementById('historyList');
  const apiStatusBadge = document.getElementById('apiStatusBadge');
  const currentChatTitle = document.getElementById('currentChatTitle');

  // Sidebar elements
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');

  // Theme elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeText = document.getElementById('themeText');

  // Settings elements
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const modelSelect = document.getElementById('modelSelect');
  const fetchModelsBtn = document.getElementById('fetchModelsBtn');

  // Math toolbar
  const mathToolbar = document.getElementById('mathToolbar');

  // Configuration from LocalStorage
  const config = {
    apiKey: localStorage.getItem('mm12_api_key') || '',
    model: localStorage.getItem('mm12_model') || 'auto',
    theme: localStorage.getItem('mm12_theme') || 'dark',
    hasServerKey: false
  };

  /* ==========================================================================
     Initialization
     ========================================================================== */
  async function init() {
    applyTheme(config.theme);
    loadSessions();
    setupEventListeners();
    setupTextareaAutoResize();
    await checkApiStatus();

    // Render KaTeX for static formulas in HTML (sample cards & chips)
    renderAllMathInPage();
  }

  /* ==========================================================================
     Theme Handling
     ========================================================================== */
  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      themeText.textContent = 'Giao diện sáng';
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      themeText.textContent = 'Giao diện tối';
    }
    config.theme = theme;
    localStorage.setItem('mm12_theme', theme);
  }

  /* ==========================================================================
     API Status Check
     ========================================================================== */
  async function checkApiStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        config.hasServerKey = data.hasServerApiKey;
        updateStatusBadge();
      } else {
        updateStatusBadge(false);
      }
    } catch (e) {
      console.warn('Không thể kết nối đến máy chủ backend:', e);
      updateStatusBadge(false);
    }
  }

  function updateStatusBadge(isOk = true) {
    apiStatusBadge.classList.remove('connected', 'warning');
    const label = apiStatusBadge.querySelector('.status-label');

    if (!isOk) {
      apiStatusBadge.classList.add('warning');
      label.textContent = 'Mất kết nối máy chủ';
      return;
    }

    if (config.hasServerKey) {
      apiStatusBadge.classList.add('connected');
      label.textContent = 'Sẵn sàng (Key Hệ Thống)';
    } else if (config.apiKey) {
      apiStatusBadge.classList.add('connected');
      label.textContent = 'Sẵn sàng (Key Cá Nhân)';
    } else {
      apiStatusBadge.classList.add('warning');
      label.textContent = 'Chưa thiết lập API Key';
    }
  }

  /* ==========================================================================
     Sessions & History Management
     ========================================================================== */
  function loadSessions() {
    try {
      const saved = localStorage.getItem('mm12_sessions');
      sessions = saved ? JSON.parse(saved) : [];
    } catch (e) {
      sessions = [];
    }

    if (sessions.length === 0) {
      createNewSession(false);
    } else {
      currentSessionId = sessions[0].id;
      renderHistoryList();
      renderCurrentSession();
    }
  }

  function saveSessions() {
    localStorage.setItem('mm12_sessions', JSON.stringify(sessions));
    renderHistoryList();
  }

  function createNewSession(render = true) {
    const newSession = {
      id: 'session_' + Date.now(),
      title: 'Bài toán mới',
      messages: [],
      createdAt: new Date().toISOString()
    };
    sessions.unshift(newSession);
    currentSessionId = newSession.id;
    saveSessions();
    if (render) {
      renderCurrentSession();
      // Auto close mobile sidebar
      closeMobileSidebar();
    }
  }

  function getCurrentSession() {
    return sessions.find(s => s.id === currentSessionId) || sessions[0];
  }

  function switchSession(id) {
    currentSessionId = id;
    renderHistoryList();
    renderCurrentSession();
    closeMobileSidebar();
  }

  function deleteSession(id, event) {
    if (event) event.stopPropagation();
    sessions = sessions.filter(s => s.id !== id);
    if (sessions.length === 0) {
      createNewSession(false);
    } else if (currentSessionId === id) {
      currentSessionId = sessions[0].id;
    }
    saveSessions();
    renderCurrentSession();
  }

  function renderHistoryList() {
    historyList.innerHTML = '';
    sessions.forEach(session => {
      const item = document.createElement('div');
      item.className = `history-item ${session.id === currentSessionId ? 'active' : ''}`;
      item.onclick = () => switchSession(session.id);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'history-text';
      titleSpan.textContent = session.title || 'Bài toán mới';

      const delBtn = document.createElement('button');
      delBtn.className = 'del-btn';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Xóa';
      delBtn.onclick = (e) => deleteSession(session.id, e);

      item.appendChild(titleSpan);
      item.appendChild(delBtn);
      historyList.appendChild(item);
    });
  }

  function renderCurrentSession() {
    const session = getCurrentSession();
    messagesFeed.innerHTML = '';

    if (!session || session.messages.length === 0) {
      welcomeHero.style.display = 'block';
      messagesFeed.style.display = 'none';
      currentChatTitle.textContent = 'Toán Học Lớp 12 & Ôn Thi THPT';
    } else {
      welcomeHero.style.display = 'none';
      messagesFeed.style.display = 'flex';
      currentChatTitle.textContent = session.title;

      session.messages.forEach(msg => {
        appendMessageElement(msg.role, msg.content, msg.image, false);
      });

      scrollToBottom();
    }
  }

  /* ==========================================================================
     LaTeX & Markdown Formatting Pipeline
     ========================================================================== */
  function renderAllMathInPage() {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  }

  function parseMarkdownAndLaTeX(text) {
    if (!text) return '';

    // Bảo vệ các khối công thức $$...$$ và $...$ để Marked không làm méo mã LaTeX
    const mathBlocks = [];
    let placeholderIdx = 0;

    // 1. Tách display math: $$...$$
    let protectedText = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      const token = `@@MATH_BLOCK_${placeholderIdx++}@@`;
      mathBlocks.push({ token, formula: `$$${formula}$$` });
      return token;
    });

    // 2. Tách inline math: $...$ (tránh match dấu $ của tiền tệ thông thường)
    protectedText = protectedText.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      const token = `@@MATH_INLINE_${placeholderIdx++}@@`;
      mathBlocks.push({ token, formula: `$${formula}$` });
      return token;
    });

    // 3. Render Markdown bằng Marked.js
    let html = '';
    if (window.marked && window.marked.parse) {
      html = window.marked.parse(protectedText);
    } else {
      html = protectedText.replace(/\n/g, '<br>');
    }

    // 4. Khôi phục lại các khối công thức LaTeX
    for (const item of mathBlocks) {
      html = html.replace(item.token, item.formula);
    }

    return html;
  }

  /* ==========================================================================
     Message Feed UI
     ========================================================================== */
  function appendMessageElement(role, content, image = null, scroll = true) {
    const isUser = role === 'user';
    const msgItem = document.createElement('div');
    msgItem.className = `message-item ${isUser ? 'user-message' : 'bot-message'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? '🧑‍🎓' : '📐';

    const body = document.createElement('div');
    body.className = 'message-body';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Nếu có ảnh đính kèm của người dùng
    if (image) {
      const imgElem = document.createElement('img');
      imgElem.className = 'user-attached-img';
      imgElem.src = image;
      imgElem.alt = 'Đề bài tải lên';
      contentDiv.appendChild(imgElem);
    }

    if (isUser) {
      const textP = document.createElement('p');
      textP.textContent = content;
      contentDiv.appendChild(textP);
    } else {
      contentDiv.innerHTML = parseMarkdownAndLaTeX(content);
      // Gọi KaTeX render lên phần tử này
      if (window.renderMathInElement) {
        renderMathInElement(contentDiv, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }
    }

    body.appendChild(contentDiv);

    // Thêm thanh tiện ích sao chép lời giải cho tin nhắn Bot
    if (!isUser) {
      const actions = document.createElement('div');
      actions.className = 'message-actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-text-btn';
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Sao chép
      `;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(content);
        copyBtn.innerHTML = `✓ Đã sao chép!`;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Sao chép
          `;
        }, 2000);
      };

      actions.appendChild(copyBtn);
      body.appendChild(actions);
    }

    msgItem.appendChild(avatar);
    msgItem.appendChild(body);
    messagesFeed.appendChild(msgItem);

    if (scroll) {
      scrollToBottom();
    }

    return msgItem;
  }

  function appendLoadingMessage() {
    const msgItem = document.createElement('div');
    msgItem.className = 'message-item bot-message';
    msgItem.id = 'loadingMessage';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '📐';

    const body = document.createElement('div');
    body.className = 'message-body';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `
      <div class="loading-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <span style="font-size: 0.8rem; color: var(--text-dim); margin-left: 0.5rem;">Đang giải toán & phân tích công thức...</span>
      </div>
    `;

    body.appendChild(contentDiv);
    msgItem.appendChild(avatar);
    msgItem.appendChild(body);
    messagesFeed.appendChild(msgItem);

    scrollToBottom();
    return msgItem;
  }

  function removeLoadingMessage() {
    const loadingElem = document.getElementById('loadingMessage');
    if (loadingElem) {
      loadingElem.remove();
    }
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  /* ==========================================================================
     Chat Interaction & Request Dispatch
     ========================================================================== */
  async function handleSendMessage(promptText = null) {
    if (isGenerating) return;

    const text = (promptText !== null ? promptText : userInput.value).trim();
    const currentImg = attachedImage ? attachedImage.dataUrl : null;

    if (!text && !currentImg) return;

    // Đảm bảo có API Key
    if (!config.hasServerKey && !config.apiKey) {
      openSettingsModal();
      alert('Vui lòng nhập Google Gemini API Key để bắt đầu giải toán!');
      return;
    }

    const session = getCurrentSession();

    // Ẩn màn hình chào nếu đây là tin nhắn đầu
    welcomeHero.style.display = 'none';
    messagesFeed.style.display = 'flex';

    // Cập nhật tiêu đề phiên nếu mới
    if (session.messages.length === 0) {
      const shortTitle = text.slice(0, 32) || (currentImg ? 'Giải bài tập qua ảnh' : 'Bài toán mới');
      session.title = shortTitle;
      currentChatTitle.textContent = shortTitle;
    }

    // Thêm tin nhắn của User
    session.messages.push({
      role: 'user',
      content: text,
      image: currentImg,
      timestamp: new Date().toISOString()
    });

    appendMessageElement('user', text, currentImg, true);

    // Reset input và ảnh preview
    userInput.value = '';
    userInput.style.height = 'auto';
    clearAttachedImage();

    // Chuẩn bị payload gửi lên API
    const historyPayload = session.messages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Bật trạng thái loading
    isGenerating = true;
    sendBtn.disabled = true;
    const loadingElem = appendLoadingMessage();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey || ''
        },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          image: currentImg,
          model: config.model || 'auto',
          mode: solveModeSelect.value,
          customApiKey: config.apiKey
        })
      });

      removeLoadingMessage();

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi gọi dịch vụ.');
      }

      const botReply = data.text || 'Xin lỗi, không nhận được câu trả lời.';

      // Lưu tin nhắn bot vào session
      session.messages.push({
        role: 'assistant',
        content: botReply,
        timestamp: new Date().toISOString()
      });

      saveSessions();
      appendMessageElement('assistant', botReply, null, true);

    } catch (err) {
      removeLoadingMessage();
      console.error('Lỗi khi trò chuyện:', err);
      const errorMsg = `⚠️ **Lỗi**: ${err.message}`;
      appendMessageElement('assistant', errorMsg, null, true);
    } finally {
      isGenerating = false;
      sendBtn.disabled = false;
      userInput.focus();
    }
  }

  /* ==========================================================================
     Image Upload & Clipboard Paste
     ========================================================================== */
  function handleImageSelected(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPEG, WebP)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 10MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      attachedImage = {
        dataUrl: e.target.result,
        name: file.name || 'anh-bai-toan.jpg'
      };

      imagePreviewImg.src = attachedImage.dataUrl;
      imageFileName.textContent = attachedImage.name;
      imagePreviewContainer.style.display = 'block';
      userInput.focus();
    };
    reader.readAsDataURL(file);
  }

  function clearAttachedImage() {
    attachedImage = null;
    imagePreviewContainer.style.display = 'none';
    imagePreviewImg.src = '';
    imageInput.value = '';
  }

  /* ==========================================================================
     Math Symbol Insertion
     ========================================================================== */
  function insertSymbol(symbol) {
    const start = userInput.selectionStart;
    const end = userInput.selectionEnd;
    const currentVal = userInput.value;

    userInput.value = currentVal.substring(0, start) + symbol + currentVal.substring(end);
    userInput.selectionStart = userInput.selectionEnd = start + symbol.length;
    userInput.focus();
  }

  /* ==========================================================================
     UI Event Listeners
     ========================================================================== */
  function setupEventListeners() {
    // Form submit
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage();
    });

    // Enter key handling (Enter để gửi, Shift+Enter xuống dòng)
    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    // Upload button
    uploadBtn.addEventListener('click', () => {
      imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleImageSelected(file);
    });

    removeImgBtn.addEventListener('click', clearAttachedImage);

    // Paste image from clipboard (Ctrl+V)
    window.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) handleImageSelected(file);
          break;
        }
      }
    });

    // Drag and drop image
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files[0] && files[0].type.startsWith('image/')) {
        handleImageSelected(files[0]);
      }
    });

    // Math chips in toolbar
    mathToolbar.querySelectorAll('.math-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const symbol = btn.getAttribute('data-insert');
        if (symbol) insertSymbol(symbol);
      });
    });

    // Sample question cards
    document.querySelectorAll('.sample-card').forEach(card => {
      card.addEventListener('click', () => {
        const sampleText = card.getAttribute('data-sample');
        if (sampleText) {
          userInput.value = sampleText;
          handleSendMessage();
        }
      });
    });

    // Topic buttons in sidebar
    document.querySelectorAll('.topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (prompt) {
          userInput.value = prompt;
          handleSendMessage();
        }
      });
    });

    // New Chat
    newChatBtn.addEventListener('click', () => {
      createNewSession(true);
    });

    // Clear Chat
    clearChatBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa bài giải của cuộc trò chuyện này?')) {
        const session = getCurrentSession();
        if (session) {
          session.messages = [];
          session.title = 'Bài toán mới';
          saveSessions();
          renderCurrentSession();
        }
      }
    });

    // Mobile Sidebar toggle
    toggleSidebarBtn.addEventListener('click', openMobileSidebar);
    closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = config.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });

    // Settings Modal
    settingsBtn.addEventListener('click', openSettingsModal);
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
    cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    saveSettingsBtn.addEventListener('click', saveSettings);
  }

  function setupTextareaAutoResize() {
    userInput.addEventListener('input', () => {
      userInput.style.height = 'auto';
      userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
    });
  }

  function openMobileSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }

  /* ==========================================================================
     Settings Modal Logic
     ========================================================================== */
  function openSettingsModal() {
    apiKeyInput.value = config.apiKey || '';
    modelSelect.value = config.model || 'auto';
    settingsModal.style.display = 'flex';
    apiKeyInput.focus();
  }

  function closeSettingsModal() {
    settingsModal.style.display = 'none';
  }

  if (fetchModelsBtn) {
    fetchModelsBtn.addEventListener('click', async () => {
      const key = (apiKeyInput.value || config.apiKey || '').trim();
      if (!key) {
        alert('Vui lòng nhập API Key trước khi quét danh sách model!');
        return;
      }
      fetchModelsBtn.textContent = '⏳ Đang quét...';
      try {
        const res = await fetch(`/api/models?apiKey=${encodeURIComponent(key)}`);
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          modelSelect.innerHTML = `<option value="auto">⚡ Tự động chọn model khả dụng nhất (Khuyên dùng)</option>`;
          data.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            modelSelect.appendChild(opt);
          });
          modelSelect.value = 'auto';
          fetchModelsBtn.textContent = `✓ Đã tìm thấy ${data.models.length} model`;
        } else {
          fetchModelsBtn.textContent = '⚠️ Không tìm thấy';
        }
      } catch (e) {
        fetchModelsBtn.textContent = '❌ Lỗi quét model';
      }
      setTimeout(() => {
        fetchModelsBtn.textContent = '🔄 Quét model cho Key này';
      }, 3000);
    });
  }

  function saveSettings() {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;

    config.apiKey = key;
    config.model = model;

    localStorage.setItem('mm12_api_key', key);
    localStorage.setItem('mm12_model', model);

    updateStatusBadge();
    closeSettingsModal();
    alert('Đã lưu cấu hình API thành công!');
  }

  // Khởi động ứng dụng khi DOM sẵn sàng
  document.addEventListener('DOMContentLoaded', init);

})();
