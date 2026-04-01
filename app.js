// ==========================================
//  AdjChat — Firebase Realtime Chat App
//  app.js — Enhanced Edition
// ==========================================

// ---- Firebase Config ----
const firebaseConfig = {
  apiKey: "AIzaSyDGw_RyJsLzKXBiJRnzy1IzX3ql1QgglW4",
  authDomain: "adjchat-8558d.firebaseapp.com",
  databaseURL: "https://adjchat-8558d-default-rtdb.firebaseio.com",
  projectId: "adjchat-8558d",
  storageBucket: "adjchat-8558d.firebasestorage.app",
  messagingSenderId: "846686155292",
  appId: "1:846686155292:web:57ee5997f99e4a52aea5d9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ---- Firebase References ----
const messagesRef    = db.ref('messages');
const onlineRef      = db.ref('online');
const typingRef      = db.ref('typing');
const stateRef       = db.ref('chatState');
const mutedUsersRef  = db.ref('mutedUsers');

// ---- App State ----
let currentUser      = null;  // { name, role, uid }
let myOnlineRef      = null;
let myTypingRef      = null;
let typingTimer      = null;
let pendingName      = null;
let isHighlightMode  = false;
let isPinNextMode    = false;
let chatMuted        = false;
let lastMsgTimestamp = 0;
let replyTo          = null;  // { key, name, text }
let myMuteData       = null;  // { until, name }
let currentPinnedId  = null;  // for force-scroll

// ---- Roles & Passwords ----
const ROLES = {
  'aman':   { password: '@aman27',   role: 'aman',  badge: null,  label: null },
  'sarika': { password: '@sarika27', role: 'admin', badge: '👑',  label: 'Admin' },
};

// ---- Quick Reactions ----
const QUICK_REACTIONS = ['❤️', '😂', '😮', '🔥', '👍', '😭', '🥰', '😎'];

// ---- Emoji Grid ----
const EMOJI_GRID = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😇','😈','😉','😊','😋','😌','😍',
  '🥰','😎','😏','😐','😑','😒','😓','😔','😕','😖','😗','😘','😙','😚','😛',
  '😜','😝','😞','😟','😠','😡','😢','😣','😤','😥','😦','😧','😨','😩','😪',
  '😫','😬','😭','😮','😯','😰','😱','😲','😳','😴','😵','🤔','🤗','🤐','🤑',
  '🤒','🤓','🤕','🤩','🤪','🤫','🤬','🤭','🤮','🤯','🥱','🥲','🥳','🥴','🥺',
  '🙃','🙄','😶','😷','🤧','🧐','🤠','🥸','🤡','🤢','👍','👎','👏','🙌','🤝',
  '🙏','💪','🫶','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕',
  '💞','💓','💗','💖','💘','💝','💟','✨','🔥','💯','💢','💥','💫','💦','💨',
  '🎉','🎊','🎈','🎀','🎁','🏆','🥇','⭐','🌟','💫','✅','❌','⚡','🌈','🌸',
  '🌹','🌺','🌻','🌼','💐','🍀','🎋','🍁','🌿','🌱','🐶','🐱','🐭','🐹','🐰',
];

// ---- DOM Elements ----
const joinScreen          = document.getElementById('joinScreen');
const chatScreen          = document.getElementById('chatScreen');
const nameInput           = document.getElementById('nameInput');
const joinBtn             = document.getElementById('joinBtn');
const passwordModal       = document.getElementById('passwordModal');
const modalTitle          = document.getElementById('modalTitle');
const modalDesc           = document.getElementById('modalDesc');
const passwordInput       = document.getElementById('passwordInput');
const passwordSubmit      = document.getElementById('passwordSubmit');
const passwordSkip        = document.getElementById('passwordSkip');
const passwordError       = document.getElementById('passwordError');
const headerName          = document.getElementById('headerName');
const headerAvatar        = document.getElementById('headerAvatar');
const headerStatus        = document.getElementById('headerStatus');
const onlineBtn           = document.getElementById('onlineBtn');
const adminMenuBtn        = document.getElementById('adminMenuBtn');
const onlinePanel         = document.getElementById('onlinePanel');
const adminPanel          = document.getElementById('adminPanel');
const closeOnlinePanel    = document.getElementById('closeOnlinePanel');
const closeAdminPanel     = document.getElementById('closeAdminPanel');
const onlineList          = document.getElementById('onlineList');
const pinnedBar           = document.getElementById('pinnedBar');
const pinnedText          = document.getElementById('pinnedText');
const unpinBtn            = document.getElementById('unpinBtn');
const messagesArea        = document.getElementById('messagesArea');
const messagesList        = document.getElementById('messagesList');
const typingIndicator     = document.getElementById('typingIndicator');
const typingLabel         = document.getElementById('typingLabel');
const mutedNotice         = document.getElementById('mutedNotice');
const messageInput        = document.getElementById('messageInput');
const sendBtn             = document.getElementById('sendBtn');
const adminExtras         = document.getElementById('adminExtras');
const highlightBtn        = document.getElementById('highlightBtn');
const pinMsgBtn           = document.getElementById('pinMsgBtn');
const clearChatBtn        = document.getElementById('clearChatBtn');
const toggleMuteBtn       = document.getElementById('toggleMuteBtn');
const sendAnnouncementBtn = document.getElementById('sendAnnouncementBtn');
const triggerHeartsBtn    = document.getElementById('triggerHeartsBtn');
const triggerEmojiBtn     = document.getElementById('triggerEmojiBtn');
const scrollToPinnedBtn   = document.getElementById('scrollToPinnedBtn');
const effectsLayer        = document.getElementById('effectsLayer');
const announcementToast   = document.getElementById('announcementToast');
const replyPreviewEl      = document.getElementById('replyPreview');
const replyToName         = document.getElementById('replyToName');
const replyToText         = document.getElementById('replyToText');
const cancelReplyBtn      = document.getElementById('cancelReply');
const emojiPickerBtn      = document.getElementById('emojiPickerBtn');
const emojiPickerEl       = document.getElementById('emojiPicker');

// ==========================================
//  PARTICLES (background canvas)
// ==========================================
(function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * 1000,
      y: Math.random() * 800,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x % W, p.y % H, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 67, 147, ${p.alpha})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ==========================================
//  EMOJI PICKER INIT
// ==========================================
function initEmojiPicker() {
  if (!emojiPickerEl) return;
  emojiPickerEl.innerHTML = '';
  EMOJI_GRID.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-grid-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      insertEmojiIntoInput(emoji);
    });
    emojiPickerEl.appendChild(btn);
  });
}

function insertEmojiIntoInput(emoji) {
  const start = messageInput.selectionStart;
  const end   = messageInput.selectionEnd;
  const val   = messageInput.value;
  messageInput.value = val.slice(0, start) + emoji + val.slice(end);
  messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
  messageInput.focus();
}

emojiPickerBtn && emojiPickerBtn.addEventListener('click', e => {
  e.stopPropagation();
  emojiPickerEl.classList.toggle('hidden');
});

document.addEventListener('click', e => {
  if (!emojiPickerEl.contains(e.target) && e.target !== emojiPickerBtn) {
    emojiPickerEl.classList.add('hidden');
  }
});

// ==========================================
//  JOIN FLOW
// ==========================================
joinBtn.addEventListener('click', handleJoin);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleJoin(); });

function handleJoin() {
  const name = nameInput.value.trim();
  if (!name) { shakeInput(nameInput); return; }

  const key = name.toLowerCase();
  if (ROLES[key]) {
    pendingName = name;
    modalTitle.textContent = `Welcome, ${name}! 👋`;
    modalDesc.textContent  = `This name has special powers. Enter password to unlock your role.`;
    passwordInput.value    = '';
    passwordError.classList.add('hidden');
    passwordModal.classList.remove('hidden');
    setTimeout(() => passwordInput.focus(), 100);
  } else {
    enterChat(name, 'user');
  }
}

passwordSubmit.addEventListener('click', handlePasswordSubmit);
passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') handlePasswordSubmit(); });

function handlePasswordSubmit() {
  const key    = pendingName.toLowerCase();
  const config = ROLES[key];
  const entered = passwordInput.value;

  if (entered === config.password) {
    passwordModal.classList.add('hidden');
    enterChat(pendingName, config.role);
  } else {
    passwordError.classList.remove('hidden');
    passwordInput.value = '';
    passwordInput.classList.add('shake');
    setTimeout(() => passwordInput.classList.remove('shake'), 500);
    setTimeout(() => {
      passwordModal.classList.add('hidden');
      enterChat(pendingName, 'user');
    }, 1500);
  }
}

passwordSkip.addEventListener('click', () => {
  passwordModal.classList.add('hidden');
  enterChat(pendingName, 'user');
});

// ==========================================
//  ENTER CHAT
// ==========================================
function enterChat(name, role) {
  // ── Unique user handling: stable uid based on name ──
  // Same name (case-insensitive) always gets the same uid.
  // This deduplicates online presence and lets them "own" their old messages.
  const uid = 'u_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  currentUser = { name, role, uid };

  // Update header
  headerName.textContent  = name;
  headerAvatar.textContent = name.charAt(0).toUpperCase();
  if (role === 'admin') {
    headerStatus.textContent = '● Admin 👑';
    headerStatus.style.color = '#e84393';
    adminMenuBtn.style.display = 'flex';
    adminExtras.classList.remove('hidden');
  } else {
    headerStatus.textContent = '● Online';
  }

  // Switch screens
  joinScreen.classList.remove('active');
  joinScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  chatScreen.classList.add('active');

  // Remove stale presence for the same name (if reconnecting with same uid, this is a no-op)
  onlineRef.once('value', snap => {
    const users = snap.val() || {};
    Object.entries(users).forEach(([existingUid, u]) => {
      if (u.name.toLowerCase() === name.toLowerCase() && existingUid !== uid) {
        onlineRef.child(existingUid).remove();
      }
    });
  });

  // Register online presence
  myOnlineRef = onlineRef.child(uid);
  myOnlineRef.set({ name, role, joined: firebase.database.ServerValue.TIMESTAMP });
  myOnlineRef.onDisconnect().remove();

  // Typing presence
  myTypingRef = typingRef.child(uid);
  myTypingRef.onDisconnect().remove();

  // System message
  postSystemMessage(`${name} joined the chat 🎉`);

  // Init emoji picker
  initEmojiPicker();

  // Start listeners
  listenMessages();
  listenOnline();
  listenTyping();
  listenChatState();
  listenPersonalMute();

  setTimeout(() => messageInput.focus(), 300);
}

// ==========================================
//  PERSONAL MUTE LISTENER
// ==========================================
function listenPersonalMute() {
  mutedUsersRef.child(currentUser.uid).on('value', snap => {
    myMuteData = snap.val();
    // Auto-clean expired mutes
    if (myMuteData && myMuteData.until < Date.now()) {
      mutedUsersRef.child(currentUser.uid).remove();
      myMuteData = null;
    }
  });
}

// ==========================================
//  REPLY FEATURE
// ==========================================
function setReplyTo(data) {
  replyTo = data;
  replyToName.textContent = data.name;
  replyToText.textContent = data.text.length > 60
    ? data.text.substring(0, 60) + '…'
    : data.text;
  replyPreviewEl.classList.remove('hidden');
  messageInput.focus();
}

function clearReply() {
  replyTo = null;
  replyPreviewEl.classList.add('hidden');
  replyToName.textContent = '';
  replyToText.textContent = '';
}

cancelReplyBtn && cancelReplyBtn.addEventListener('click', clearReply);

// ==========================================
//  SEND MESSAGE
// ==========================================
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener('input', () => {
  if (!currentUser || chatMuted) return;
  clearTimeout(typingTimer);
  myTypingRef && myTypingRef.set({ name: currentUser.name, ts: Date.now() });
  typingTimer = setTimeout(() => {
    myTypingRef && myTypingRef.remove();
  }, 2500);
});

function sendMessage() {
  if (!currentUser) return;

  // Global chat mute check
  if (chatMuted && currentUser.role !== 'admin') {
    showToast('🔇 Chat is muted by admin');
    return;
  }

  // Personal mute check
  if (myMuteData && myMuteData.until > Date.now() && currentUser.role !== 'admin') {
    const remaining = Math.ceil((myMuteData.until - Date.now()) / 60000);
    showToast(`🔇 You are muted for ${remaining} more minute(s)`);
    return;
  }

  const text = messageInput.value.trim();
  if (!text) return;

  const now = Date.now();
  if (now - lastMsgTimestamp < 700) return; // debounce
  lastMsgTimestamp = now;

  const msg = {
    text,
    name:        currentUser.name,
    role:        currentUser.role,
    uid:         currentUser.uid,
    timestamp:   firebase.database.ServerValue.TIMESTAMP,
    highlighted: isHighlightMode && currentUser.role === 'admin',
    pinNext:     isPinNextMode   && currentUser.role === 'admin',
  };

  // Attach reply reference if active
  if (replyTo) {
    msg.replyTo = {
      key:  replyTo.key,
      name: replyTo.name,
      text: replyTo.text.substring(0, 120),
    };
  }

  messagesRef.push(msg).then(ref => {
    if (isPinNextMode && currentUser.role === 'admin') {
      stateRef.update({ pinnedText: text, pinnedId: ref.key });
      setPinMode(false);
    }
    if (isHighlightMode) setHighlightMode(false);
  });

  messageInput.value = '';
  clearReply();
  myTypingRef && myTypingRef.remove();
  clearTimeout(typingTimer);
}

// ==========================================
//  LISTEN MESSAGES
// ==========================================
function listenMessages() {
  messagesList.innerHTML = '';

  messagesRef.limitToLast(100).on('child_added', snap => {
    const msg = snap.val();
    if (!msg) return;
    renderMessage(snap.key, msg);
    scrollToBottom();
  });

  // Real-time updates: reactions, edits, highlights
  messagesRef.on('child_changed', snap => {
    const msg = snap.val();
    if (!msg || msg.type === 'system') return;
    updateMessageElement(snap.key, msg);
  });

  messagesRef.on('child_removed', snap => {
    const el = document.getElementById(`msg-${snap.key}`);
    if (el) {
      el.style.transition = 'all 0.25s ease';
      el.style.opacity    = '0';
      el.style.transform  = 'scale(0.9)';
      setTimeout(() => el.remove(), 250);
    }
  });
}

// ---- Create message DOM element (returns element) ----
function createMessageElement(key, msg) {
  // System / announcement messages
  if (msg.type === 'system') {
    const el = document.createElement('div');
    el.className = 'system-msg' + (msg.announcement ? ' announcement' : '');
    el.id = `msg-${key}`;
    el.textContent = msg.text;
    return el;
  }

  const isMe    = currentUser && msg.uid === currentUser.uid;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canDel  = isMe || isAdmin;           // all users can delete own; admin deletes any
  const canEdit = isAdmin;                   // only admin can edit any message

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = `msg-wrapper ${isMe ? 'me' : 'other'}`;
  wrapper.id = `msg-${key}`;

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar' + (msg.role === 'admin' ? ' admin-avatar' : '');
  avatar.textContent = msg.name.charAt(0).toUpperCase();

  // Body
  const body = document.createElement('div');
  body.className = 'msg-body';

  // Sender name (for "other" messages)
  if (!isMe) {
    const nameEl = document.createElement('div');
    nameEl.className = 'msg-name';
    nameEl.textContent = msg.name;
    if (msg.role === 'admin') {
      const badge = document.createElement('span');
      badge.className = 'role-badge';
      badge.textContent = '👑 Admin';
      nameEl.appendChild(badge);
    }
    body.appendChild(nameEl);
  }

  // ── Reply preview (jump-to-quoted message) ──
  if (msg.replyTo) {
    const rp = document.createElement('div');
    rp.className = 'msg-reply-preview';
    rp.innerHTML = `
      <span class="rp-sender">↩ ${escapeHtml(msg.replyTo.name)}</span>
      <span class="rp-snippet">${escapeHtml(msg.replyTo.text)}</span>
    `;
    rp.addEventListener('click', () => {
      const target = document.getElementById(`msg-${msg.replyTo.key}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('flash-highlight');
        setTimeout(() => target.classList.remove('flash-highlight'), 1200);
      }
    });
    body.appendChild(rp);
  }

  // ── Bubble ──
  const bubble = document.createElement('div');
  let bubbleClass = 'msg-bubble';
  if (msg.highlighted) bubbleClass += ' highlighted';
  bubble.className = bubbleClass;

  const textSpan = document.createElement('span');
  textSpan.className = 'msg-text';
  textSpan.textContent = msg.text;
  bubble.appendChild(textSpan);

  if (msg.edited) {
    const editedBadge = document.createElement('span');
    editedBadge.className = 'msg-edited';
    editedBadge.textContent = ' ✏️';
    editedBadge.title = 'Edited';
    bubble.appendChild(editedBadge);
  }

  body.appendChild(bubble);

  // ── Action buttons (appear on hover / tap) ──
  const actions = document.createElement('div');
  actions.className = `msg-actions ${isMe ? 'actions-left' : 'actions-right'}`;

  // Reply (all users)
  const replyBtn = document.createElement('button');
  replyBtn.className = 'msg-action-btn';
  replyBtn.title     = 'Reply';
  replyBtn.textContent = '↩';
  replyBtn.addEventListener('click', e => {
    e.stopPropagation();
    setReplyTo({ key, name: msg.name, text: msg.text });
  });
  actions.appendChild(replyBtn);

  // Quick-react
  const reactBtn = document.createElement('button');
  reactBtn.className   = 'msg-action-btn';
  reactBtn.title       = 'React';
  reactBtn.textContent = '😊';
  reactBtn.addEventListener('click', e => {
    e.stopPropagation();
    showReactionPicker(key, reactBtn);
  });
  actions.appendChild(reactBtn);

  // Edit (admin only)
  if (canEdit) {
    const editBtn = document.createElement('button');
    editBtn.className   = 'msg-action-btn';
    editBtn.title       = 'Edit';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      editMessage(key, msg.text);
    });
    actions.appendChild(editBtn);
  }

  // Pin (admin only) — pins this specific message
  if (isAdmin) {
    const pinBtn = document.createElement('button');
    pinBtn.className   = 'msg-action-btn';
    pinBtn.title       = msg.pinned ? 'Unpin' : 'Pin';
    pinBtn.textContent = msg.pinned ? '📌' : '📍';
    pinBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (msg.pinned) {
        messagesRef.child(key).update({ pinned: false });
        if (currentPinnedId === key) stateRef.update({ pinnedText: null, pinnedId: null });
      } else {
        messagesRef.child(key).update({ pinned: true });
        stateRef.update({ pinnedText: msg.text, pinnedId: key });
      }
    });
    actions.appendChild(pinBtn);
  }

  // Delete (own messages for all users, any message for admin)
  if (canDel) {
    const delBtn = document.createElement('button');
    delBtn.className   = 'msg-action-btn danger';
    delBtn.title       = 'Delete';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      deleteMessage(key);
    });
    actions.appendChild(delBtn);
  }

  body.appendChild(actions);

  // ── Reactions display ──
  if (msg.reactions) {
    const reactionsEl = buildReactionsEl(key, msg.reactions);
    body.appendChild(reactionsEl);
  }

  // ── Timestamp ──
  const timeEl = document.createElement('div');
  timeEl.className   = 'msg-time';
  const ts = msg.timestamp ? new Date(msg.timestamp) : new Date();
  timeEl.textContent = formatTime(ts) + (msg.pinned ? ' 📌' : '');

  body.appendChild(timeEl);

  wrapper.appendChild(avatar);
  wrapper.appendChild(body);

  // Mobile: tap to toggle action visibility
  wrapper.addEventListener('click', e => {
    if (e.target.closest('.msg-action-btn') || e.target.closest('.msg-reply-preview') || e.target.closest('.msg-reactions')) return;
    wrapper.classList.toggle('actions-visible');
    // Close other open ones
    document.querySelectorAll('.msg-wrapper.actions-visible').forEach(w => {
      if (w !== wrapper) w.classList.remove('actions-visible');
    });
  });

  return wrapper;
}

function renderMessage(key, msg) {
  const el = createMessageElement(key, msg);
  if (el) messagesList.appendChild(el);
}

// ---- Surgically update an existing message element (no full re-render) ----
function updateMessageElement(key, msg) {
  const existing = document.getElementById(`msg-${key}`);
  if (!existing) return;

  // Update text
  const textEl = existing.querySelector('.msg-text');
  if (textEl && textEl.textContent !== msg.text) {
    textEl.textContent = msg.text;
  }

  // Update edited badge
  const bubble = existing.querySelector('.msg-bubble');
  if (bubble) {
    bubble.classList.toggle('highlighted', !!msg.highlighted);
    if (msg.edited && !existing.querySelector('.msg-edited')) {
      const badge = document.createElement('span');
      badge.className   = 'msg-edited';
      badge.textContent = ' ✏️';
      badge.title       = 'Edited';
      bubble.appendChild(badge);
    }
  }

  // Update timestamp pin indicator
  const timeEl = existing.querySelector('.msg-time');
  if (timeEl) {
    const ts = msg.timestamp ? new Date(msg.timestamp) : new Date();
    timeEl.textContent = formatTime(ts) + (msg.pinned ? ' 📌' : '');
  }

  // Update reactions
  const oldReactions = existing.querySelector('.msg-reactions');
  if (oldReactions) oldReactions.remove();
  if (msg.reactions) {
    const body = existing.querySelector('.msg-body');
    if (body) {
      const timeRef = body.querySelector('.msg-time');
      const newReactions = buildReactionsEl(key, msg.reactions);
      if (timeRef) body.insertBefore(newReactions, timeRef);
      else body.appendChild(newReactions);
    }
  }
}

// ==========================================
//  REACTIONS
// ==========================================
function showReactionPicker(msgKey, anchor) {
  // Close any existing reaction picker
  document.querySelectorAll('.reaction-picker-popup').forEach(el => el.remove());

  const picker = document.createElement('div');
  picker.className = 'reaction-picker-popup';

  QUICK_REACTIONS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className   = 'reaction-pick-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleReaction(msgKey, emoji);
      picker.remove();
    });
    picker.appendChild(btn);
  });

  // Position relative to anchor
  const actionsEl = anchor.closest('.msg-actions') || anchor.parentNode;
  actionsEl.appendChild(picker);

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', () => picker.remove(), { once: true });
  }, 0);
}

function toggleReaction(msgKey, emoji) {
  if (!currentUser) return;
  // Safe emoji key: convert to code points
  const emojiKey = [...emoji].map(c => c.codePointAt(0).toString(16)).join('_');
  const reactionRef = messagesRef.child(msgKey).child('reactions').child(emojiKey);

  reactionRef.once('value', snap => {
    const data = snap.val() || {};
    if (data[currentUser.uid]) {
      // Remove my reaction
      reactionRef.child(currentUser.uid).remove();
    } else {
      // Add my reaction: store emoji display char + uid
      reactionRef.child(currentUser.uid).set({ emoji, name: currentUser.name });
    }
  });
}

function buildReactionsEl(msgKey, reactions) {
  const container = document.createElement('div');
  container.className = 'msg-reactions';

  // reactions: { emojiKey: { uid: { emoji, name }, ... }, ... }
  Object.entries(reactions).forEach(([emojiKey, users]) => {
    if (!users || typeof users !== 'object') return;
    const entries = Object.values(users);
    if (entries.length === 0) return;

    const displayEmoji = entries[0]?.emoji || '';
    if (!displayEmoji) return;

    const hasMyReaction = currentUser && !!users[currentUser.uid];
    const names = entries.map(e => e.name).join(', ');

    const chip = document.createElement('button');
    chip.className = 'reaction-chip' + (hasMyReaction ? ' my-reaction' : '');
    chip.textContent = `${displayEmoji} ${entries.length}`;
    chip.title       = names;
    chip.addEventListener('click', e => {
      e.stopPropagation();
      toggleReaction(msgKey, displayEmoji);
    });
    container.appendChild(chip);
  });

  return container;
}

// ==========================================
//  LISTEN ONLINE USERS
// ==========================================
function listenOnline() {
  onlineRef.on('value', snap => {
    const users = snap.val() || {};

    // Deduplicate by name (in case of stale entries)
    const seen = new Set();
    const uniqueUsers = [];
    Object.entries(users).forEach(([uid, u]) => {
      const key = u.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueUsers.push({ uid, ...u });
      }
    });

    onlineList.innerHTML = '';
    uniqueUsers.forEach(u => {
      const li = document.createElement('li');

      const dot = document.createElement('span');
      dot.className = 'online-dot';
      li.appendChild(dot);

      const nameSpan = document.createElement('span');
      nameSpan.textContent = u.name + (u.role === 'admin' ? ' 👑' : '');
      nameSpan.style.flex  = '1';
      li.appendChild(nameSpan);

      // Admin: show mute button per user (not for themselves)
      if (currentUser?.role === 'admin' && u.uid !== currentUser.uid) {
        const muteBtn = document.createElement('button');
        muteBtn.className   = 'mute-user-btn';
        muteBtn.textContent = '🔇';
        muteBtn.title       = `Mute ${u.name}`;
        muteBtn.addEventListener('click', e => {
          e.stopPropagation();
          adminMuteUser(u.uid, u.name);
        });
        li.appendChild(muteBtn);
      }

      onlineList.appendChild(li);
    });

    const count = uniqueUsers.length;
    headerStatus.textContent = `● ${count} online`;
    if (currentUser?.role === 'admin') {
      headerStatus.textContent = `● Admin 👑 · ${count} online`;
      headerStatus.style.color = '#e84393';
    }
  });
}

// ==========================================
//  LISTEN TYPING
// ==========================================
function listenTyping() {
  typingRef.on('value', snap => {
    const data   = snap.val() || {};
    const others = Object.entries(data)
      .filter(([uid]) => !currentUser || uid !== currentUser.uid)
      .map(([, v]) => v.name);

    if (others.length > 0) {
      const label = others.slice(0, 2).join(', ') + (others.length > 1 ? ' are' : ' is') + ' typing...';
      typingLabel.textContent = label;
      typingIndicator.classList.remove('hidden');
      scrollToBottom();
    } else {
      typingIndicator.classList.add('hidden');
    }
  });
}

// ==========================================
//  LISTEN CHAT STATE (mute, pin, announcements)
// ==========================================
function listenChatState() {
  stateRef.on('value', snap => {
    const state = snap.val() || {};
    window._currentChatState = state;

    // Global mute
    chatMuted = !!state.muted;
    mutedNotice.classList.toggle('hidden', !chatMuted);
    messageInput.disabled = chatMuted && currentUser?.role !== 'admin';
    sendBtn.disabled      = chatMuted && currentUser?.role !== 'admin';
    toggleMuteBtn.textContent = chatMuted ? '🔊 Unmute Chat' : '🔇 Mute Chat';

    // Pinned bar
    currentPinnedId = state.pinnedId || null;
    if (state.pinnedText) {
      pinnedText.textContent = state.pinnedText;
      pinnedBar.classList.remove('hidden');
    } else {
      pinnedBar.classList.add('hidden');
    }

    // Announcement toast
    if (state.announcement && state.announcement !== window._lastAnnouncement) {
      window._lastAnnouncement = state.announcement;
      showToast('📢 ' + state.announcement);
    }

    // Effects
    if (state.heartsTrigger && state.heartsTrigger !== window._lastHeartsTrigger) {
      window._lastHeartsTrigger = state.heartsTrigger;
      launchEffect('hearts');
    }
    if (state.confettiTrigger && state.confettiTrigger !== window._lastConfettiTrigger) {
      window._lastConfettiTrigger = state.confettiTrigger;
      launchEffect('confetti');
    }
  });
}

// ==========================================
//  DELETE MESSAGE
// ==========================================
function deleteMessage(key) {
  messagesRef.child(key).remove();
}

// ==========================================
//  EDIT MESSAGE (admin)
// ==========================================
function editMessage(key, currentText) {
  const newText = prompt('Edit message:', currentText);
  if (newText === null || newText.trim() === '' || newText.trim() === currentText) return;
  messagesRef.child(key).update({ text: newText.trim(), edited: true });
}

// ==========================================
//  SYSTEM MESSAGE
// ==========================================
function postSystemMessage(text, isAnnouncement = false) {
  messagesRef.push({
    type:         'system',
    text,
    announcement: isAnnouncement,
    timestamp:    firebase.database.ServerValue.TIMESTAMP
  });
}

// ==========================================
//  ADMIN ACTIONS
// ==========================================
clearChatBtn && clearChatBtn.addEventListener('click', () => {
  if (!confirm('Clear ALL messages? This cannot be undone.')) return;
  messagesRef.remove().then(() => {
    postSystemMessage('🗑️ Chat was cleared by Admin');
  });
});

toggleMuteBtn && toggleMuteBtn.addEventListener('click', () => {
  const newMuted = !chatMuted;
  stateRef.update({ muted: newMuted });
  postSystemMessage(newMuted ? '🔇 Chat has been muted by Admin' : '🔊 Chat unmuted by Admin');
});

sendAnnouncementBtn && sendAnnouncementBtn.addEventListener('click', () => {
  const text = prompt('Enter announcement text:');
  if (text && text.trim()) {
    postSystemMessage(`📢 ${text.trim()}`, true);
    showToast('📢 ' + text.trim());
  }
});

triggerHeartsBtn && triggerHeartsBtn.addEventListener('click', () => {
  stateRef.update({ heartsTrigger: Date.now() });
});

triggerEmojiBtn && triggerEmojiBtn.addEventListener('click', () => {
  stateRef.update({ confettiTrigger: Date.now() });
});

scrollToPinnedBtn && scrollToPinnedBtn.addEventListener('click', () => {
  if (currentPinnedId) {
    const target = document.getElementById(`msg-${currentPinnedId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('flash-highlight');
      setTimeout(() => target.classList.remove('flash-highlight'), 1200);
    }
  } else {
    showToast('No message is pinned');
  }
});

// Clicking pinned bar → scroll to that message
pinnedBar && pinnedBar.addEventListener('click', e => {
  if (e.target === unpinBtn) return;
  if (currentPinnedId) {
    const target = document.getElementById(`msg-${currentPinnedId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('flash-highlight');
      setTimeout(() => target.classList.remove('flash-highlight'), 1200);
    }
  }
});

unpinBtn && unpinBtn.addEventListener('click', () => {
  // Also remove pinned flag from the message
  if (currentPinnedId) {
    messagesRef.child(currentPinnedId).update({ pinned: false });
  }
  stateRef.update({ pinnedText: null, pinnedId: null });
});

// Admin mute specific user
function adminMuteUser(targetUid, targetName) {
  const minutes = parseInt(prompt(`Mute ${targetName} for how many minutes? (0 = unmute)`, '5'), 10);
  if (isNaN(minutes)) return;
  if (minutes === 0) {
    mutedUsersRef.child(targetUid).remove();
    postSystemMessage(`🔊 ${targetName} has been unmuted by Admin`);
    showToast(`🔊 ${targetName} unmuted`);
  } else {
    mutedUsersRef.child(targetUid).set({
      until: Date.now() + minutes * 60000,
      name:  targetName
    });
    postSystemMessage(`🔇 ${targetName} has been muted for ${minutes} minute(s) by Admin`);
    showToast(`🔇 ${targetName} muted for ${minutes}m`);
  }
}

// Highlight / Pin-next toggles (admin footer extras)
highlightBtn && highlightBtn.addEventListener('click', () => setHighlightMode(!isHighlightMode));
pinMsgBtn    && pinMsgBtn.addEventListener('click',    () => setPinMode(!isPinNextMode));

function setHighlightMode(val) {
  isHighlightMode = val;
  highlightBtn.classList.toggle('active', val);
  if (val) showToast('💖 Next message will be highlighted');
}

function setPinMode(val) {
  isPinNextMode = val;
  pinMsgBtn.classList.toggle('active', val);
  if (val) showToast('📌 Next message will be pinned');
}

// ==========================================
//  PANELS
// ==========================================
onlineBtn.addEventListener('click', () => {
  onlinePanel.classList.remove('hidden');
  adminPanel.classList.add('hidden');
  adminPanel.classList.remove('open');
  setTimeout(() => onlinePanel.classList.add('open'), 10);
});

adminMenuBtn.addEventListener('click', () => {
  adminPanel.classList.remove('hidden');
  onlinePanel.classList.add('hidden');
  onlinePanel.classList.remove('open');
  setTimeout(() => adminPanel.classList.add('open'), 10);
});

closeOnlinePanel.addEventListener('click', () => {
  onlinePanel.classList.remove('open');
  setTimeout(() => onlinePanel.classList.add('hidden'), 250);
});

closeAdminPanel.addEventListener('click', () => {
  adminPanel.classList.remove('open');
  setTimeout(() => adminPanel.classList.add('hidden'), 250);
});

document.addEventListener('click', e => {
  if (!onlinePanel.contains(e.target) && e.target !== onlineBtn) {
    onlinePanel.classList.remove('open');
    setTimeout(() => { if (!onlinePanel.classList.contains('open')) onlinePanel.classList.add('hidden'); }, 250);
  }
  if (!adminPanel.contains(e.target) && e.target !== adminMenuBtn) {
    adminPanel.classList.remove('open');
    setTimeout(() => { if (!adminPanel.classList.contains('open')) adminPanel.classList.add('hidden'); }, 250);
  }
});

// ==========================================
//  EFFECTS
// ==========================================
function launchEffect(type) {
  const emojis = type === 'hearts'
    ? ['💖', '💕', '❤️', '💗', '💓', '💞', '🩷']
    : ['🎉', '✨', '🎊', '⭐', '🌟', '💫', '🎈'];

  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'effect-particle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left  = Math.random() * 100 + 'vw';
      el.style.top   = '-40px';
      const dur = 2.5 + Math.random() * 2;
      el.style.animationDuration = dur + 's';
      el.style.fontSize = (18 + Math.random() * 16) + 'px';
      effectsLayer.appendChild(el);
      setTimeout(() => el.remove(), dur * 1000 + 100);
    }, i * 80);
  }
}

// ==========================================
//  ANNOUNCEMENT TOAST
// ==========================================
let toastTimer = null;
function showToast(text) {
  clearTimeout(toastTimer);
  announcementToast.textContent = text;
  announcementToast.classList.remove('hidden');
  toastTimer = setTimeout(() => announcementToast.classList.add('hidden'), 3500);
}

// ==========================================
//  HELPERS
// ==========================================
function scrollToBottom(force = false) {
  const area = messagesArea;
  const threshold = 120;
  const isNearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < threshold;
  if (isNearBottom || force) {
    requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; });
  }
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function shakeInput(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
  setTimeout(() => el.style.animation = '', 400);
  el.focus();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Dynamic shake keyframe
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);

// ==========================================
//  KEYBOARD / VIEWPORT FIX (mobile)
// ==========================================
if (typeof window !== 'undefined') {
  const fixViewport = () => {
    if (document.activeElement === messageInput) {
      setTimeout(() => scrollToBottom(true), 350);
    }
  };
  messageInput.addEventListener('focus', fixViewport);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (chatScreen && !chatScreen.classList.contains('hidden')) scrollToBottom();
    });
  }
}

// ==========================================
//  GSAP entrance animations
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap !== 'undefined') {
    gsap.from('.join-card', { duration: 0.6, y: 40, opacity: 0, ease: 'back.out(1.4)' });
  }
});
