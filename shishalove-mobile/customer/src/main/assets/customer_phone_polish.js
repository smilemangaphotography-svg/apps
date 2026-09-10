(function () {
  'use strict';

  var HOME_URL = 'https://shishalove.eu/shishalove-app/?app=android&build=111';
  var TOP_LEVEL = ['HOOKAH', 'BOWLS', 'HOSES', 'ACCESSORIES', 'CHARCOAL', 'FLAVORS', 'MERCHANDISE'];
  var CATEGORY_PHOTOS = {
    'HOOKAH': '/product-category/hookah/',
    'BOWLS': '/product-category/bowls/',
    'HOSES': '/product-category/hose/',
    'ACCESSORIES': '/product-category/accessories/',
    'CHARCOAL': '/product-category/charcoal/',
    'FLAVORS': '/product-category/flavors/',
    'MERCHANDISE': '/product-category/merchandise/',
    'WOOKAH': '/product-category/wookah/hookah-wookah/',
    'ALPHA': '/product-category/alpha/',
    'STEAMULATION': '/product-category/steamulation/',
    'UNION': '/product-category/union/',
    'MIG': '/product-category/mig/',
    'EL-BADIA': '/product-category/el-badia/hookah-el-badia/',
    'MOZE': '/product-category/moze/hookah-moze/',
    'ANIMA': '/product-category/anima/',
    'GOLD MINER': '/product-category/gold-miner/',
    'YKAP': '/product-category/ykap/',
    'MEXANIKA': '/product-category/mexanika/',
    'DIAVLA': '/product-category/diavla/'
  };

  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    var s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0.02;
  }

  function directText(el) {
    if (!el) return '';
    var value = '';
    Array.prototype.forEach.call(el.childNodes || [], function (node) {
      if (node.nodeType === 3) value += ' ' + (node.nodeValue || '');
    });
    return value.replace(/\s+/g, ' ').trim();
  }

  function normalizeUrl(value) {
    if (!value) return '';
    value = String(value).trim().split(/\s+/)[0];
    if (!value || value.indexOf('data:image/') === 0) return value;
    if (value.indexOf('//') === 0) value = 'https:' + value;
    value = value.replace(/^http:\/\/(www\.)?shishalove\.eu/i, 'https://shishalove.eu');
    try { return new URL(value, location.href).href; } catch (e) { return value; }
  }

  function candidateImage(img) {
    var names = ['data-src', 'data-lazy-src', 'data-original', 'data-lazyload', 'data-lazy', 'data-image', 'data-orig-file'];
    for (var i = 0; i < names.length; i++) {
      var v = img.getAttribute(names[i]);
      if (v) return normalizeUrl(v);
    }
    var srcset = img.getAttribute('data-srcset') || img.getAttribute('srcset');
    if (srcset) {
      var last = srcset.split(',').pop().trim().split(/\s+/)[0];
      if (last) return normalizeUrl(last);
    }
    return normalizeUrl(img.getAttribute('src') || '');
  }

  function repairImages() {
    document.querySelectorAll('img').forEach(function (img) {
      img.style.setProperty('visibility', 'visible', 'important');
      img.style.setProperty('opacity', '1', 'important');
      img.style.setProperty('max-width', '100%', 'important');
      img.setAttribute('decoding', 'async');
      var current = normalizeUrl(img.getAttribute('src') || '');
      var candidate = candidateImage(img);
      if ((!current || current.indexOf('data:image/gif') === 0 || current.indexOf('placeholder') >= 0) && candidate) {
        img.src = candidate;
      } else if (current && current !== img.src && current.indexOf('data:') !== 0) {
        img.src = current;
      }
      if (!img.dataset.sl112Repair) {
        img.dataset.sl112Repair = '1';
        img.addEventListener('error', function () {
          var next = candidateImage(img);
          if (next && next !== img.src) img.src = next;
        });
      }
    });

    document.querySelectorAll('[data-bg],[data-background],[data-background-image],[data-lazy-bg]').forEach(function (el) {
      var src = el.getAttribute('data-bg') || el.getAttribute('data-background') || el.getAttribute('data-background-image') || el.getAttribute('data-lazy-bg');
      src = normalizeUrl(src);
      if (src) el.style.setProperty('background-image', 'url("' + src.replace(/"/g, '') + '")', 'important');
    });
  }

  function findDrawer() {
    var selectors = ['aside', 'nav', '.drawer', '.side-menu', '.mobile-menu', '.offcanvas', '.off-canvas', '.sl-drawer', '.menu-drawer', '.mobile-nav'];
    var nodes = [];
    selectors.forEach(function (selector) {
      try { document.querySelectorAll(selector).forEach(function (el) { if (nodes.indexOf(el) < 0) nodes.push(el); }); } catch (e) {}
    });
    var best = null;
    var score = -1;
    nodes.forEach(function (el) {
      if (!visible(el)) return;
      var text = (el.innerText || '').toUpperCase();
      if (text.indexOf('FLAVORS') < 0 || text.indexOf('MERCHANDISE') < 0) return;
      var r = el.getBoundingClientRect();
      var s = getComputedStyle(el);
      var n = 0;
      if (r.width > innerWidth * 0.60 && r.width < innerWidth * 0.98) n += 4;
      if (r.height > innerHeight * 0.60) n += 4;
      if (s.position === 'fixed' || s.position === 'absolute') n += 3;
      if (text.indexOf('MY ACCOUNT') >= 0) n += 2;
      if (text.indexOf('CUSTOMER SUPPORT') >= 0) n += 2;
      if (n > score) { score = n; best = el; }
    });
    return best;
  }

  function isLightBackground(color) {
    var m = String(color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return m && Number(m[1]) > 225 && Number(m[2]) > 225 && Number(m[3]) > 225;
  }

  function fixDrawer() {
    var drawer = findDrawer();
    if (!drawer) return;
    drawer.style.setProperty('background', '#080808', 'important');
    drawer.style.setProperty('background-color', '#080808', 'important');
    drawer.style.setProperty('color', '#ffffff', 'important');
    var dr = drawer.getBoundingClientRect();

    drawer.querySelectorAll('*').forEach(function (el) {
      var r = el.getBoundingClientRect();
      var s = getComputedStyle(el);
      if (isLightBackground(s.backgroundColor) && r.width > dr.width * 0.55 && r.height > 55) {
        el.style.setProperty('background', '#080808', 'important');
        el.style.setProperty('background-color', '#080808', 'important');
      }
      var txt = directText(el);
      if (txt) {
        el.style.setProperty('color', '#ffffff', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
      }
    });

    drawer.querySelectorAll('a,button,li,[role="button"]').forEach(function (el) {
      el.style.setProperty('color', '#ffffff', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
    });
    drawer.querySelectorAll('svg').forEach(function (svg) {
      svg.style.setProperty('color', '#ffffff', 'important');
      svg.style.setProperty('opacity', '1', 'important');
    });
    drawer.querySelectorAll('svg path,svg line,svg circle,svg rect,svg polyline,svg polygon').forEach(function (shape) {
      if (shape.getAttribute('stroke') && shape.getAttribute('stroke') !== 'none') shape.style.setProperty('stroke', '#ffffff', 'important');
      if (shape.getAttribute('fill') && shape.getAttribute('fill') !== 'none') shape.style.setProperty('fill', '#ffffff', 'important');
    });
  }

  function pageTitle() {
    var heads = document.querySelectorAll('h1,h2,[data-page-title],.page-title,.category-title');
    for (var i = 0; i < heads.length; i++) {
      if (!visible(heads[i])) continue;
      var t = (heads[i].innerText || '').replace(/\s+/g, ' ').trim().toUpperCase();
      if (t) return t;
    }
    return '';
  }

  function looksLikeBack(control) {
    if (!control) return false;
    var txt = (control.innerText || control.textContent || '').replace(/\s+/g, '').trim();
    var aria = (control.getAttribute('aria-label') || control.getAttribute('title') || '').toLowerCase();
    var cls = String(control.className || '').toLowerCase();
    return txt === '←' || txt === '‹' || aria.indexOf('back') >= 0 || cls.indexOf('back') >= 0;
  }

  function installBackFix() {
    if (window.__sl112BackFix) return;
    window.__sl112BackFix = true;
    document.addEventListener('click', function (event) {
      var control = event.target && event.target.closest ? event.target.closest('a,button,[role="button"]') : null;
      if (!looksLikeBack(control)) return;
      var title = pageTitle();
      if (TOP_LEVEL.indexOf(title) < 0) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      location.assign(HOME_URL);
    }, true);
  }

  function cardForLabel(label) {
    var wanted = label.toUpperCase();
    var leaves = Array.prototype.slice.call(document.querySelectorAll('a,button,div,span,strong,p,h2,h3,h4'));
    var best = null;
    var bestArea = Infinity;
    leaves.forEach(function (el) {
      if (!visible(el)) return;
      var txt = (el.innerText || '').replace(/\s+/g, ' ').trim().toUpperCase();
      if (txt !== wanted) return;
      var node = el;
      for (var i = 0; i < 5 && node; i++, node = node.parentElement) {
        var r = node.getBoundingClientRect();
        if (r.width >= 115 && r.height >= 95 && r.width <= innerWidth * 0.62 && r.height <= 360) {
          var area = r.width * r.height;
          if (area < bestArea) { bestArea = area; best = { card: node, label: el }; }
        }
      }
    });
    return best;
  }

  function usablePhoto(card) {
    var img = card.querySelector('img:not(.sl-native-category-photo)');
    if (!img) return false;
    var src = candidateImage(img);
    return !!src && src.indexOf('data:image/gif') !== 0 && src.toLowerCase().indexOf('placeholder') < 0;
  }

  function installCardPhoto(hit, src) {
    if (!hit || !hit.card || !src || hit.card.querySelector('.sl-native-category-photo')) return;
    var card = hit.card;
    var label = hit.label;
    card.style.setProperty('position', 'relative', 'important');
    card.style.setProperty('overflow', 'hidden', 'important');
    card.style.setProperty('background', '#ffffff', 'important');
    var img = document.createElement('img');
    img.className = 'sl-native-category-photo';
    img.src = normalizeUrl(src);
    img.alt = label ? (label.innerText || '') : '';
    img.decoding = 'async';
    img.style.cssText = 'position:absolute!important;left:0!important;top:0!important;width:100%!important;height:72%!important;object-fit:contain!important;object-position:center!important;background:#fff!important;padding:8px!important;box-sizing:border-box!important;opacity:1!important;visibility:visible!important;z-index:1!important;';
    card.insertBefore(img, card.firstChild);
    card.querySelectorAll('svg').forEach(function (svg) { svg.style.setProperty('display', 'none', 'important'); });
    if (label) {
      label.style.setProperty('position', 'absolute', 'important');
      label.style.setProperty('left', '8px', 'important');
      label.style.setProperty('right', '8px', 'important');
      label.style.setProperty('bottom', '14px', 'important');
      label.style.setProperty('z-index', '2', 'important');
      label.style.setProperty('text-align', 'center', 'important');
      label.style.setProperty('color', '#111111', 'important');
      label.style.setProperty('-webkit-text-fill-color', '#111111', 'important');
      label.style.setProperty('background', 'rgba(255,255,255,.94)', 'important');
    }
  }

  function imageFromHtml(html, pagePath) {
    try {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var img = doc.querySelector('ul.products li.product img, .products .product img, li.product img, img.wp-post-image');
      if (!img) return '';
      var src = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || img.getAttribute('src');
      if (!src) {
        var srcset = img.getAttribute('data-srcset') || img.getAttribute('srcset');
        if (srcset) src = srcset.split(',').pop().trim().split(/\s+/)[0];
      }
      return normalizeUrl(src || '');
    } catch (e) { return ''; }
  }

  function hydrateCard(label, path) {
    var hit = cardForLabel(label);
    if (!hit || usablePhoto(hit.card)) return;
    var key = 'sl112-photo:' + label;
    var cached = '';
    try { cached = localStorage.getItem(key) || ''; } catch (e) {}
    if (cached) { installCardPhoto(hit, cached); return; }
    window.__sl112Fetches = window.__sl112Fetches || {};
    if (window.__sl112Fetches[label]) return;
    window.__sl112Fetches[label] = true;
    fetch(path, { credentials: 'include', cache: 'force-cache' })
      .then(function (response) { return response.ok ? response.text() : ''; })
      .then(function (html) {
        var src = imageFromHtml(html, path);
        if (!src) return;
        try { localStorage.setItem(key, src); } catch (e) {}
        installCardPhoto(cardForLabel(label), src);
      })
      .catch(function () {})
      .finally(function () { window.__sl112Fetches[label] = false; });
  }

  function hydrateCategoryPhotos() {
    Object.keys(CATEGORY_PHOTOS).forEach(function (label, index) {
      setTimeout(function () { hydrateCard(label, CATEGORY_PHOTOS[label]); }, index * 55);
    });
  }

  function hideReleaseBadge() {
    document.querySelectorAll('body *').forEach(function (el) {
      if (el.children.length) return;
      if (!/^RELEASE\s+1\.1\.\d+$/i.test((el.textContent || '').trim())) return;
      var p = getComputedStyle(el).position;
      if (p === 'fixed' || p === 'absolute') el.style.setProperty('display', 'none', 'important');
    });
  }

  function fix() {
    document.querySelectorAll('input[autofocus],textarea[autofocus]').forEach(function (el) { el.removeAttribute('autofocus'); });
    var active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) active.blur();
    repairImages();
    fixDrawer();
    hideReleaseBadge();
  }

  if (!document.getElementById('sl-native-112-style')) {
    var style = document.createElement('style');
    style.id = 'sl-native-112-style';
    style.textContent = '@media(max-width:600px){header img{max-height:68px!important;width:auto!important}.site-header img,.header-logo img{max-width:190px!important;height:auto!important}input,select,button{font-size:16px}.sl-bottom-nav,.bottom-navigation,.bottom-nav{padding-bottom:max(8px,env(safe-area-inset-bottom))!important}.sl-native-category-photo{pointer-events:none!important}}';
    document.head.appendChild(style);
  }

  installBackFix();
  fix();
  setTimeout(hydrateCategoryPhotos, 120);

  if (!window.__sl112Observer) {
    var scheduled = false;
    window.__sl112Observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        fix();
        hydrateCategoryPhotos();
      }, 180);
    });
    window.__sl112Observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
