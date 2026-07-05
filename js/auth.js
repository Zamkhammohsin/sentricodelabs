(function () {
  'use strict';

  var SCRIPT_URL = document.querySelector('#contact-form').action;

  /* ─── Hidden trigger: 5 clicks in 3s ─── */
  var trigger = document.querySelector('.auth-trigger');
  var clickCount = 0;
  var clickTimer = null;
  var modal = document.getElementById('auth-modal');
  var isAuthenticated = !!sessionStorage.getItem('auth_token');

  function cleanUser(str) {
    return str.replace(/[^a-zA-Z0-9._-]/g, '');
  }

  if (trigger) {
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(function () { clickCount = 0; }, 3000);
      }
      if (clickCount >= 5) {
        clearTimeout(clickTimer);
        clickCount = 0;
        showModal();
      }
    });
  }

  /* ─── Modal ─── */
  function showModal() {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('auth-username').focus();
  }

  function hideModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('auth-error').hidden = true;
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) hideModal();
    });
  }

  document.querySelector('.auth-close').addEventListener('click', hideModal);

  /* ─── Login ─── */
  document.getElementById('auth-submit').addEventListener('click', function () {
    var username = cleanUser(document.getElementById('auth-username').value.trim());
    var password = document.getElementById('auth-password').value;
    var errorEl = document.getElementById('auth-error');

    if (!username || !password) {
      errorEl.textContent = 'Invalid credentials.';
      errorEl.hidden = false;
      return;
    }

    this.disabled = true;
    this.textContent = 'Signing in…';
    errorEl.hidden = true;

    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        v: 1,
        t: 'l',
        u: username,
        p: password,
        a: navigator.userAgent
      })
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (data && data.s) {
        sessionStorage.setItem('auth_token', data.t);
        sessionStorage.setItem('auth_role', data.r || '');
        sessionStorage.setItem('auth_user', username);
        hideModal();
        enterEditMode();
      } else {
        errorEl.textContent = 'Invalid credentials.';
        errorEl.hidden = false;
      }
    })
    .catch(function () {
      errorEl.textContent = 'Invalid credentials.';
      errorEl.hidden = false;
    })
    .finally(function () {
      document.getElementById('auth-submit').disabled = false;
      document.getElementById('auth-submit').textContent = 'Sign In';
    });
  });

  document.getElementById('auth-password').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('auth-submit').click();
  });

  /* ─── Edit Mode ─── */
  var saveBar = document.getElementById('save-bar');
  var saveBtn = document.getElementById('save-btn');
  var exitBtn = document.getElementById('exit-edit-btn');

  function enterEditMode() {
    var els = document.querySelectorAll('[data-editable]');
    els.forEach(function (el) { el.contentEditable = 'true'; });
    if (saveBar) saveBar.hidden = false;
    loadContentOverrides();
  }

  function exitEditMode() {
    var els = document.querySelectorAll('[data-editable]');
    els.forEach(function (el) { el.contentEditable = 'false'; });
    if (saveBar) saveBar.hidden = true;
  }

  /* ─── Load saved content ─── */
  function loadContentOverrides() {
    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ v: 1, t: 'g' })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.s && data.c) {
        data.c.forEach(function (item) {
          var el = document.querySelector('[data-editable="' + item.i + '"]');
          if (el) el.innerHTML = item.h;
        });
      }
    })
    .catch(function () {});
  }

  /* ─── Save changes ─── */
  function saveChanges() {
    var els = document.querySelectorAll('[data-editable]');
    var content = [];
    els.forEach(function (el) {
      content.push({
        i: el.getAttribute('data-editable'),
        h: el.innerHTML
      });
    });

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        v: 1,
        t: 's',
        k: sessionStorage.getItem('auth_token'),
        u: sessionStorage.getItem('auth_user'),
        c: content
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.s) {
        saveBtn.textContent = 'Saved!';
        setTimeout(function () { saveBtn.textContent = 'Save Changes'; }, 2000);
      } else {
        saveBtn.textContent = 'Save Failed';
      }
    })
    .catch(function () {
      saveBtn.textContent = 'Save Failed';
    })
    .finally(function () {
      saveBtn.disabled = false;
    });
  }

  if (saveBtn) saveBtn.addEventListener('click', saveChanges);
  if (exitBtn) exitBtn.addEventListener('click', exitEditMode);

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      if (!saveBar || saveBar.hidden) return;
      e.preventDefault();
      saveChanges();
    }
  });

  if (isAuthenticated) {
    enterEditMode();
  }
})();
