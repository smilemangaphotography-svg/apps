(function () {
  'use strict';

  function normalizeUrl(value) {
    if (!value) return '';
    value = String(value).trim().split(/\s+/)[0];
    if (value.indexOf('//') === 0) value = 'https:' + value;
    value = value.replace(/^http:\/\/(www\.)?shishalove\.eu/i, 'https://shishalove.eu');
    try { return new URL(value, location.href).href; } catch (e) { return value; }
  }

  function candidate(img) {
    var attrs = ['data-src', 'data-lazy-src', 'data-original', 'data-lazyload', 'data-lazy', 'data-image', 'data-orig-file'];
    for (var i = 0; i < attrs.length; i++) {
      var value = img.getAttribute(attrs[i]);
      if (value) return normalizeUrl(value);
    }
    var srcset = img.getAttribute('data-srcset') || img.getAttribute('srcset');
    if (srcset) return normalizeUrl(srcset.split(',').pop().trim().split(/\s+/)[0]);
    return normalizeUrl(img.getAttribute('src') || '');
  }

  function repair() {
    document.querySelectorAll('img').forEach(function (img) {
      var src = candidate(img);
      if (src && (!img.getAttribute('src') || img.getAttribute('src').indexOf('placeholder') >= 0 || img.getAttribute('src').indexOf('data:image/gif') === 0)) img.src = src;
      img.style.setProperty('visibility', 'visible', 'important');
      img.style.setProperty('opacity', '1', 'important');
      img.setAttribute('decoding', 'async');
      if (!img.dataset.sl112Repair) {
        img.dataset.sl112Repair = '1';
        img.addEventListener('error', function () {
          var retry = candidate(img);
          if (retry && retry !== img.src) img.src = retry;
        });
      }
    });

    document.querySelectorAll('[data-bg],[data-background],[data-background-image],[data-lazy-bg]').forEach(function (el) {
      var src = el.getAttribute('data-bg') || el.getAttribute('data-background') || el.getAttribute('data-background-image') || el.getAttribute('data-lazy-bg');
      src = normalizeUrl(src);
      if (src) el.style.setProperty('background-image', 'url("' + src.replace(/"/g, '') + '")', 'important');
    });

    document.querySelectorAll('body *').forEach(function (el) {
      if (el.children.length) return;
      if (!/^RELEASE\s+1\.1\.\d+$/i.test((el.textContent || '').trim())) return;
      var p = getComputedStyle(el).position;
      if (p === 'fixed' || p === 'absolute') el.style.setProperty('display', 'none', 'important');
    });
  }

  if (!document.getElementById('sl-merchant-native-112-style')) {
    var style = document.createElement('style');
    style.id = 'sl-merchant-native-112-style';
    style.textContent = '@media(max-width:600px){img{max-width:100%}input,select,button,textarea{font-size:16px}}';
    document.head.appendChild(style);
  }

  repair();
  if (!window.__slMerchant112Observer) {
    var scheduled = false;
    window.__slMerchant112Observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () { scheduled = false; repair(); }, 180);
    });
    window.__slMerchant112Observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
