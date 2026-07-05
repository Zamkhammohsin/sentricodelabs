(function () {
  'use strict';

  /* ─── Header scroll ─── */
  const header = document.querySelector('.header');
  let lastScroll = 0;

  window.addEventListener('scroll', function () {
    const y = window.scrollY;
    if (y > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = y;
  }, { passive: true });

  /* ─── Mobile nav ─── */
  const toggleBtn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  if (toggleBtn && nav) {
    toggleBtn.addEventListener('click', function () {
      nav.classList.toggle('open');
      const isOpen = nav.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
      toggleBtn.innerHTML = isOpen
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });

    document.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
      });
    });
  }

  /* ─── Hero canvas particles ─── */
  (function initParticles() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var w, h;
    var particles = [];
    var PARTICLE_COUNT = 110;

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }

    function Particle(x, y) {
      this.x = x || Math.random() * w;
      this.y = y || Math.random() * h;
      this.size = 2 + Math.random() * 8;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = 0.08 + Math.random() * 0.2;
      this.hue = Math.random() * 60 + 25;
    }

    Particle.prototype.update = function () {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0) this.x = w;
      if (this.x > w) this.x = 0;
      if (this.y < 0) this.y = h;
      if (this.y > h) this.y = 0;
    };

    Particle.prototype.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + this.hue + ', 40%, 60%, ' + this.opacity + ')';
      ctx.fill();
    };

    function init() {
      resize();
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }

    function drawLines() {
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'hsla(35, 30%, 70%, ' + (0.04 * (1 - dist / 180)) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    function drawGradient() {
      var grad1 = ctx.createRadialGradient(w * 0.2, h * 0.5, 0, w * 0.2, h * 0.5, w * 0.6);
      grad1.addColorStop(0, 'rgba(212,165,116,0.04)');
      grad1.addColorStop(1, 'rgba(212,165,116,0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      var grad2 = ctx.createRadialGradient(w * 0.8, h * 0.3, 0, w * 0.8, h * 0.3, w * 0.5);
      grad2.addColorStop(0, 'rgba(107,154,140,0.04)');
      grad2.addColorStop(1, 'rgba(107,154,140,0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);

      var grad3 = ctx.createRadialGradient(w * 0.5, h * 0.8, 0, w * 0.5, h * 0.8, w * 0.5);
      grad3.addColorStop(0, 'rgba(155,139,126,0.03)');
      grad3.addColorStop(1, 'rgba(155,139,126,0)');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, w, h);
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      drawGradient();
      for (var i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      drawLines();
      requestAnimationFrame(animate);
    }

    init();
    animate();

    window.addEventListener('resize', function () {
      resize();
    });
  })();

  /* ─── Scroll reveal ─── */
  var revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealElements.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ─── Multi-step contact form ─── */
  var form = document.getElementById('contact-form');
  if (form) {
    var steps = form.querySelectorAll('.form-step');
    var progressSteps = form.querySelectorAll('.progress-step');
    var totalSteps = steps.length;
    var currentStep = 0;
    var formData = {};

    function getContactInput(step) {
      var toggle = step.querySelector('.toggle-option.active');
      var contactType = toggle ? toggle.dataset.value : 'phone';
      return step.querySelector('#' + contactType + '-input .form-input');
    }

    function showStep(index) {
      steps.forEach(function (s, i) {
        s.classList.toggle('active', i === index);
      });
      progressSteps.forEach(function (p, i) {
        p.classList.remove('active', 'done');
        if (i < index) p.classList.add('done');
        if (i === index) p.classList.add('active');
      });
      currentStep = index;
      updateNextButton();
    }

    function getStepData(stepIndex) {
      var step = steps[stepIndex];
      if (stepIndex === 2) {
        var toggle = step.querySelector('.toggle-option.active');
        var contactType = toggle ? toggle.dataset.value : 'email';
        var input = getContactInput(step);
        return { type: contactType, value: input ? input.value.trim() : '' };
      }
      var selected = step.querySelector('.option-card.selected');
      if (selected) return { value: selected.dataset.value };

      var input = step.querySelector('.form-input');
      if (input) return { value: input.value.trim() };

      return { value: '' };
    }

    function validateStep(stepIndex) {
      var step = steps[stepIndex];
      if (stepIndex === 2) {
        var input = getContactInput(step);
        if (!input) return false;
        var val = input.value.trim();
        if (!val) return false;
        if (input.type === 'email') {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        }
        if (input.type === 'tel') {
          return /^[\d\s\-\+\(\)]{7,20}$/.test(val);
        }
        return val.length > 0;
      }
      var selected = step.querySelector('.option-card.selected');
      if (selected) return true;

      var input = step.querySelector('.form-input');
      if (input) {
        var val = input.value.trim();
        if (!val) return false;
        return true;
      }
      return false;
    }

    function updateNextButton() {
      var btn = steps[currentStep].querySelector('.btn-next');
      if (!btn) return;
      var valid = validateStep(currentStep);
      btn.disabled = !valid;
      btn.classList.toggle('btn-disabled', !valid);
    }

    // Option card clicks
    document.querySelectorAll('.option-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var parent = this.closest('.form-step');
        parent.querySelectorAll('.option-card').forEach(function (c) {
          c.classList.remove('selected');
        });
        this.classList.add('selected');
        updateNextButton();
      });
    });

    // Toggle clicks
    document.querySelectorAll('.toggle-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var parent = this.closest('.toggle-group');
        parent.querySelectorAll('.toggle-option').forEach(function (o) {
          o.classList.remove('active');
        });
        this.classList.add('active');
        updateNextButton();
      });
    });

    // Input events for real-time validation
    document.querySelectorAll('.form-input').forEach(function (input) {
      input.addEventListener('input', function () {
        updateNextButton();
      });
    });

    // Next buttons
    document.querySelectorAll('.btn-next').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!validateStep(currentStep)) return;
        formData['step_' + currentStep] = getStepData(currentStep);

        if (currentStep < totalSteps - 1) {
          showStep(currentStep + 1);
        }
      });
    });

    // Back buttons
    document.querySelectorAll('.btn-back').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (currentStep > 0) {
          formData['step_' + currentStep] = getStepData(currentStep);
          showStep(currentStep - 1);
        }
      });
    });

    // Handle contact toggle switching between phone/email
    var contactToggle = document.querySelector('.toggle-group');
    if (contactToggle) {
      var phoneInput = document.getElementById('phone-input');
      var emailInput = document.getElementById('email-input');
      var hiddenInput = document.querySelector('input[name="contact_value"]');

      document.querySelectorAll('.toggle-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
          var val = this.dataset.value;
          if (phoneInput && emailInput && hiddenInput) {
            if (val === 'phone') {
              phoneInput.style.display = 'block';
              emailInput.style.display = 'none';
              phoneInput.querySelector('.form-input').required = true;
              emailInput.querySelector('.form-input').required = false;
              hiddenInput.value = 'phone';
            } else {
              phoneInput.style.display = 'none';
              emailInput.style.display = 'block';
              phoneInput.querySelector('.form-input').required = false;
              emailInput.querySelector('.form-input').required = true;
              hiddenInput.value = 'email';
            }
          }
          updateNextButton();
        });
      });
    }

    // Helper: show message
    function showFormMessage(msg, type) {
      var el = document.getElementById('form-message');
      if (!el) return;
      el.textContent = msg;
      el.className = 'form-message ' + type;
    }

    function hideFormMessage() {
      var el = document.getElementById('form-message');
      if (el) { el.className = 'form-message'; el.textContent = ''; }
    }

    // Helper: show confirmation screen
    function showConfirmation() {
      hideFormMessage();
      var confirmation = document.getElementById('form-confirmation');
      if (confirmation) {
        confirmation.style.display = 'block';
        steps.forEach(function (s) { s.classList.remove('active'); });
        progressSteps.forEach(function (p) {
          p.classList.remove('active');
          p.classList.add('done');
        });
      }
    }

    // Form submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideFormMessage();
      formData['step_' + currentStep] = getStepData(currentStep);

      var name = (formData['step_3'] && formData['step_3'].value) || '';
      var contactData = formData['step_2'] || {};
      var contactType = contactData.type || 'email';
      var contactVal = contactData.value || '';

      var projectLabel = (formData['step_0'] && formData['step_0'].value) || '';
      var timelineLabel = (formData['step_1'] && formData['step_1'].value) || '';

      var email = '';
      var phone = '';
      if (contactType === 'email') {
        email = contactVal;
      } else {
        phone = contactVal;
      }

      var payload = {
        name: name,
        email: email,
        phone: phone,
        projectType: projectLabel,
        timeline: timelineLabel,
        contactMethod: contactType === 'email' ? 'Email' : 'Phone'
      };

      var action = form.getAttribute('action');
      if (!action || action === '[GOOGLE_SCRIPT_URL]') {
        showFormMessage('Error: Google Script URL not configured. Replace [GOOGLE_SCRIPT_URL] with your deployed script URL.', 'error');
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      var xhr = new XMLHttpRequest();
      xhr.open('POST', action, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.onload = function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send'; }
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var resp = JSON.parse(xhr.responseText);
            if (resp.success) {
              showConfirmation();
            } else {
              showFormMessage('Submission failed. Please try again or email us directly.', 'error');
            }
          } catch (e) {
            showConfirmation();
          }
        } else {
          showFormMessage('Submission failed (server error). Please try again later.', 'error');
        }
      };

      xhr.onerror = function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send'; }
        showFormMessage('Network error. Please check your connection and try again.', 'error');
      };

      xhr.send(JSON.stringify(payload));
    });

    showStep(0);
  }

})();
