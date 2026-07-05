/**
 * Sentricodelabs – Google Apps Script Backend
 *
 * Handles contact form submissions, dual-user authentication,
 * content editing, and access logging.
 *
 * Sheet structure (in the bound spreadsheet):
 *   "Contact Submissions" – Date, Name, Email, Phone, Project Type, Timeline, Contact Method
 *   "Credentials"         – username, passwordHash, salt, role (Founder / Co-Founder)
 *   "Access Logs"         – timestamp, username, status, userAgent
 *   "Content Overrides"   – editableId, html, updatedAt, updatedBy
 */

/* ─── Helpers ─── */

function sha256(input) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
  var hex = '';
  for (var i = 0; i < digest.length; i++) {
    hex += ('0' + (digest[i] & 0xFF).toString(16)).slice(-2);
  }
  return hex;
}

function generateSalt() {
  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var salt = '';
  for (var i = 0; i < 16; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

function generateToken(username) {
  var raw = username + ':' + new Date().getTime() + ':' + generateSalt();
  return sha256(raw);
}

function jsonResponse(obj, status) {
  var output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) sheet.appendRow(headers);
  }
  return sheet;
}

/* ─── Initialization (run manually once) ─── */

function initializeSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, 'Contact Submissions', ['Date', 'Name', 'Email', 'Phone', 'Project Type', 'Timeline', 'Contact Method']);
  getOrCreateSheet(ss, 'Credentials', ['username', 'passwordHash', 'salt', 'role']);
  getOrCreateSheet(ss, 'Access Logs', ['timestamp', 'username', 'status', 'userAgent']);
  getOrCreateSheet(ss, 'Content Overrides', ['editableId', 'html', 'updatedAt', 'updatedBy']);
}

function createUser(username, password, role) {
  var salt = generateSalt();
  var hash = sha256(password + salt);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'Credentials', ['username', 'passwordHash', 'salt', 'role']);
  sheet.appendRow([username, hash, salt, role]);
}

function setupFounder() {
  var ui = SpreadsheetApp.getUi();
  var name = ui.prompt('Founder Username', 'Enter founder username:', ui.ButtonSet.OK_CANCEL);
  if (name.getSelectedButton() !== ui.Button.OK) return;
  var pass = ui.prompt('Founder Password', 'Enter founder password:', ui.ButtonSet.OK_CANCEL);
  if (pass.getSelectedButton() !== ui.Button.OK) return;
  createUser(name.getResponseText(), pass.getResponseText(), 'Founder');
  ui.alert('Founder account created. You can now sign in on the site.');
}

function setupCoFounder() {
  var ui = SpreadsheetApp.getUi();
  var name = ui.prompt('Co-Founder Username', 'Enter co-founder username:', ui.ButtonSet.OK_CANCEL);
  if (name.getSelectedButton() !== ui.Button.OK) return;
  var pass = ui.prompt('Co-Founder Password', 'Enter co-founder password:', ui.ButtonSet.OK_CANCEL);
  if (pass.getSelectedButton() !== ui.Button.OK) return;
  createUser(name.getResponseText(), pass.getResponseText(), 'Co-Founder');
  ui.alert('Co-Founder account created. You can now sign in on the site.');
}

function setNotificationEmail() {
  var ui = SpreadsheetApp.getUi();
  var email = ui.prompt('Notification Email', 'Enter the email address to receive contact form notifications:', ui.ButtonSet.OK_CANCEL);
  if (email.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperty('NOTIFICATION_EMAIL', email.getResponseText());
  ui.alert('Notification email set to ' + email.getResponseText());
}

function sanitize(str) {
  return String(str).replace(/[^a-zA-Z0-9._@\-\s]/g, '');
}

function isRateLimited(ss, username) {
  var logSheet = getOrCreateSheet(ss, 'Access Logs', ['timestamp', 'username', 'status', 'userAgent']);
  var rows = logSheet.getDataRange().getValues();
  var cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  var attempts = 0;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === username && rows[i][2] === 'FAILED' && rows[i][0] >= cutoff) {
      attempts++;
      if (attempts > 5) return true;
    }
  }
  return false;
}

/* ─── POST Handler ─── */

function doPost(e) {
  try {
    var data = {};
    try {
      data = JSON.parse(e.postData.contents);
    } catch (jsonErr) {
      data = e.parameter || {};
    }
    var t = data.t || data.action;

    if (t === 'l') return handleLogin(data);
    if (t === 's') return handleSaveContent(data);
    if (t === 'g') return handleGetContent(data);
    if (t === 'submit' || data.action === 'submit' || data.name !== undefined) {
      return handleContactSubmit(data);
    }

    return jsonResponse({ s: false });
  } catch (err) {
    return jsonResponse({ s: false });
  }
}

function doGet(e) {
  return jsonResponse({ s: true });
}

/* ─── Contact Form Submission ─── */

function handleContactSubmit(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'Contact Submissions', ['Date', 'Name', 'Email', 'Phone', 'Project Type', 'Timeline', 'Contact Method']);

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.phone || '',
    data.projectType || '',
    data.timeline || '',
    data.contactMethod || ''
  ]);

  var notifyEmail = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL');
  if (notifyEmail) {
    try {
      MailApp.sendEmail({
        to: notifyEmail,
        subject: 'New Contact — ' + (data.name || 'Anonymous'),
        htmlBody: '<strong>New contact form submission</strong><br><br>' +
          '<b>Name:</b> ' + (data.name || '—') + '<br>' +
          '<b>Email:</b> ' + (data.email || '—') + '<br>' +
          '<b>Phone:</b> ' + (data.phone || '—') + '<br>' +
          '<b>Project Type:</b> ' + (data.projectType || '—') + '<br>' +
          '<b>Timeline:</b> ' + (data.timeline || '—') + '<br>' +
          '<b>Contact Method:</b> ' + (data.contactMethod || '—')
      });
    } catch (e) {
      console.error('Email notification failed: ' + e.message);
    }
  }

  return jsonResponse({ success: true });
}

/* ─── Authentication ─── */

function handleLogin(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var credsSheet = getOrCreateSheet(ss, 'Credentials', ['username', 'passwordHash', 'salt', 'role']);
  var logSheet = getOrCreateSheet(ss, 'Access Logs', ['timestamp', 'username', 'status', 'userAgent']);

  var username = sanitize(data.u || data.username || '');
  var userAgent = sanitize(data.a || data.userAgent || '');
  var password = String(data.p || data.password || '');

  if (!username || !password) {
    return jsonResponse({ s: false });
  }

  if (isRateLimited(ss, username)) {
    logSheet.appendRow([new Date().toISOString(), username, 'BLOCKED', userAgent]);
    return jsonResponse({ s: false });
  }

  var rows = credsSheet.getDataRange().getValues();
  var found = false;
  var storedHash = '';
  var salt = '';
  var role = '';

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === username) {
      found = true;
      storedHash = rows[i][1];
      salt = rows[i][2];
      role = rows[i][3];
      break;
    }
  }

  var authStatus = 'FAILED';
  var token = '';

  if (found) {
    var computedHash = sha256(password + salt);
    if (computedHash === storedHash) {
      authStatus = 'SUCCESS';
      token = generateToken(username);
    }
  }

  logSheet.appendRow([
    new Date().toISOString(),
    username,
    authStatus,
    userAgent
  ]);

  if (authStatus === 'SUCCESS') {
    return jsonResponse({ s: true, t: token, r: role });
  }

  return jsonResponse({ s: false });
}

/* ─── Content Management ─── */

function handleSaveContent(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'Content Overrides', ['editableId', 'html', 'updatedAt', 'updatedBy']);

  var overrides = data.c || data.content || [];
  var now = new Date().toISOString();
  var username = sanitize(data.u || data.username || '');

  for (var i = 0; i < overrides.length; i++) {
    var item = overrides[i];
    var id = item.i || item.id;
    var html = item.h || item.html;
    var existing = findContentRow(sheet, id);

    if (existing > 0) {
      sheet.getRange(existing, 2).setValue(html);
      sheet.getRange(existing, 3).setValue(now);
      sheet.getRange(existing, 4).setValue(username);
    } else {
      sheet.appendRow([id, html, now, username]);
    }
  }

  return jsonResponse({ s: true });
}

function findContentRow(sheet, id) {
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) return i + 1;
  }
  return -1;
}

function handleGetContent(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'Content Overrides', ['editableId', 'html', 'updatedAt', 'updatedBy']);

  var rows = sheet.getDataRange().getValues();
  var overrides = [];

  for (var i = 1; i < rows.length; i++) {
    overrides.push({ i: rows[i][0], h: rows[i][1] });
  }

  return jsonResponse({ s: true, c: overrides });
}
