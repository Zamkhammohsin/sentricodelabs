(function () {
  'use strict';

  var SUPABASE_URL = 'https://gczbyxdchknsfepewfub.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjemJ5eGRjaGtuc2ZlcGV3ZnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNDgzNTgsImV4cCI6MjA5ODgyNDM1OH0.k-0olIoNwjuqMRkUdEAeu5MURvylLWzHSKmriFqpN94';

  var sbClient = null;

  function getSB() {
    if (sbClient) return sbClient;
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof createClient !== 'undefined') {
      sbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return sbClient;
  }

  getSB();

  window.signUpAdmins = function () {
    var sb = getSB();
    if (!sb) { console.error('Supabase not loaded'); return; }
    var users = [
      { email: 'zam@sentricodelabs.com', password: 'z@1k@2026' },
      { email: 'saiqa@sentricodelabs.com', password: 's@2k@2026' }
    ];
    users.forEach(function (u) {
      sb.auth.signUp({ email: u.email, password: u.password })
        .then(function (res) {
          if (res.error) console.error('Signup failed for ' + u.email + ':', res.error.message);
          else console.log('Signup success for ' + u.email + ':', res.data);
        });
    });
  };

  function loginUser(email, password) {
    var sb = getSB();
    if (!sb) return Promise.reject({ message: 'Supabase not loaded' });
    return sb.auth.signInWithPassword({ email: email, password: password });
  }

  function logoutUser() {
    var sb = getSB();
    if (!sb) return Promise.reject({ message: 'Supabase not loaded' });
    return sb.auth.signOut();
  }

  function checkAuthStatus() {
    var sb = getSB();
    if (!sb) return Promise.resolve({ data: { session: null } });
    return sb.auth.getSession();
  }

  function getCurrentUser() {
    var sb = getSB();
    if (!sb) return null;
    var session = sb.auth.getSession();
    if (session && session.data && session.data.session) {
      return session.data.session.user;
    }
    return null;
  }

  var trigger = document.querySelector('.auth-trigger');
  var clickCount = 0;
  var clickTimer = null;
  var modal = document.getElementById('auth-modal');
  var isAuthenticated = false;

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
        checkAuthStatus().then(function (res) {
          if (res.data && res.data.session) {
            isAuthenticated = true;
            enterEditMode();
          } else {
            showModal();
          }
        });
      }
    });
  }

  function showModal() {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('auth-email').focus();
  }

  function hideModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('auth-error').hidden = true;
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) hideModal();
    });
  }

  document.querySelector('.auth-close').addEventListener('click', hideModal);

  document.getElementById('auth-submit').addEventListener('click', function () {
    var email = document.getElementById('auth-email').value.trim();
    var password = document.getElementById('auth-password').value;
    var errorEl = document.getElementById('auth-error');

    if (!email || !password) {
      errorEl.textContent = 'Invalid credentials.';
      errorEl.hidden = false;
      return;
    }

    this.disabled = true;
    this.textContent = 'Signing in\u2026';
    errorEl.hidden = true;

    loginUser(email, password)
      .then(function (res) {
        if (res.error) throw res.error;
        isAuthenticated = true;
        hideModal();
        enterEditMode();
      })
      .catch(function (err) {
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

  var saveBar = document.getElementById('save-bar');
  var saveBtn = document.getElementById('save-btn');
  var exitBtn = document.getElementById('exit-edit-btn');

  function enterEditMode() {
    document.body.contentEditable = 'true';
    if (saveBar) saveBar.hidden = false;
    loadContentOverrides();
  }

  function exitEditMode() {
    document.body.contentEditable = 'false';
    if (saveBar) saveBar.hidden = true;
    isAuthenticated = false;
  }

  function loadContentOverrides() {
    try {
      var saved = localStorage.getItem('sc_content');
      if (saved) {
        var items = JSON.parse(saved);
        items.forEach(function (item) {
          var el = document.querySelector('[data-editable="' + item.i + '"]');
          if (el) el.innerHTML = item.h;
        });
      }
    } catch (e) {}
  }

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
    saveBtn.textContent = 'Saving\u2026';

    try {
      localStorage.setItem('sc_content', JSON.stringify(content));
      saveBtn.textContent = 'Saved!';
      setTimeout(function () { saveBtn.textContent = 'Save Changes'; }, 2000);
    } catch (e) {
      saveBtn.textContent = 'Save Failed';
    }
    saveBtn.disabled = false;
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

})();
