/* Ziyue Zhang — site interactions */

(() => {
  /* ---------- nav border on scroll ---------- */
  const nav = document.getElementById('nav');

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const isStatic = location.search.includes('static');
  if (isStatic) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            ro.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    revealEls.forEach((el) => ro.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- active nav item ---------- */
  const sections = ['about', 'work', 'experience', 'beyond', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = new Map(
    [...document.querySelectorAll('[data-nav]')].map((a) => [a.dataset.nav, a])
  );

  const setActive = (id) => {
    links.forEach((a, key) => a.classList.toggle('active', key === id));
  };

  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.15, 0.4] }
    );
    sections.forEach((s) => so.observe(s));
  }

  /* ---------- keyword micro-interaction ---------- */
  document.querySelectorAll('.kw').forEach((el) => {
    const bump = () => {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    };
    el.addEventListener('mouseenter', bump);
    el.addEventListener('click', bump);
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        bump();
      }
    });
  });

  /* ---------- experience · 折扇 + 表盘 ---------- */
  const fanBlock = document.querySelector('[data-fan-block]');
  if (fanBlock) {
    const cards = [...fanBlock.querySelectorAll('.fan-card-wrapper')];
    const stage = fanBlock.querySelector('[data-fan-stage]');
    const arc = fanBlock.querySelector('[data-dial-arc]');
    const dotsWrap = fanBlock.querySelector('[data-dial-dots]');
    const prevBtn = fanBlock.querySelector('[data-fan-prev]');
    const nextBtn = fanBlock.querySelector('[data-fan-next]');
    const n = cards.length;
    const SPREAD = 14;      // 每张卡片在表盘上的角距（度）
    /* 扇形半径 = 表盘半径（499/400/300/220），保证卡片弧线与刻度弧线同心；
       同时按视口收缩，避免小屏横向溢出、侧卡被裁太多 */
    const radius = () => {
      const w = window.innerWidth;
      if (w <= 520) return 220;
      if (w <= 760) return 300;
      if (w <= 1080) return 400;
      return 499;
    };
    const cardRot = () => (window.innerWidth <= 520 ? 13 : 17);
    let idx = 0;

    const years = cards.map((c) => {
      const era = c.querySelector('.era-back');
      return era ? era.textContent.replace('Era_', '').trim() : '';
    });

    /* 生成刻度（41 根，随圆环旋转） */
    const TICKS = 41;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < TICKS; i++) {
      const t = document.createElement('div');
      t.className = 'dial-tick';
      t.style.transform = `rotate(${(i - (TICKS - 1) / 2) * (SPREAD / 2)}deg)`;
      frag.appendChild(t);
    }
    arc.appendChild(frag);

    /* 年份标记：独立图层，按角度算坐标，文字永远正立 */
    const markersLayer = document.createElement('div');
    markersLayer.className = 'dial-markers';
    arc.parentElement.appendChild(markersLayer);

    years.forEach((y, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dial-marker';
      b.dataset.go = String(i);
      b.setAttribute('aria-label', y);
      b.innerHTML = `<span class="dial-marker-year">${y}</span><div class="dial-marker-bar"></div>`;
      b.addEventListener('click', () => { flip(null); go(i); });
      markersLayer.appendChild(b);
    });

    const markers = [...markersLayer.querySelectorAll('.dial-marker')];
    const dots = dotsWrap ? [...dotsWrap.querySelectorAll('.dial-dot')] : [];

    const flip = (i) => {
      cards.forEach((c, k) => {
        c.querySelector('.fan-flip-card').classList.toggle('flipped', k === i);
      });
    };

    const layout = () => {
      const RADIUS = radius();
      const CARD_ROT = cardRot();
      cards.forEach((card, i) => {
        const off = i - idx;
        const a = (off * SPREAD * Math.PI) / 180;
        const tx = RADIUS * Math.sin(a);
        const ty = ((RADIUS - RADIUS * Math.cos(a)) / 2) + 20 + (off === 0 ? -16 : 0);
        const rot = off * CARD_ROT;
        const z = 10 - Math.abs(off);
        const sc = off === 0 ? 1.05 : 0.84 - Math.abs(off) * 0.045;

        card.style.transform =
          `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scale(${sc})`;
        card.style.zIndex = String(z);
        card.classList.toggle('active', off === 0);
        card.classList.toggle('inactive', off !== 0);
        card.setAttribute('aria-current', off === 0 ? 'true' : 'false');
      });

      const arcRot = (idx - (n - 1) / 2) * -SPREAD;
      arc.style.transform = `rotate(${arcRot}deg)`;

      /* 标记沿圆弧定位：角度 = 基准角 + 圆环旋转角 */
      const R = arc.clientWidth / 2 || 300;
      markers.forEach((m, i) => {
        const a = (((i - (n - 1) / 2) * SPREAD) + arcRot) * (Math.PI / 180);
        const x = Math.sin(a) * R;
        const y = -Math.cos(a) * R;
        m.style.transform = `translate(-50%,-100%) translate(${x}px,${y}px)`;
        m.classList.toggle('dial-marker--active', i === idx);
      });
      dots.forEach((d, i) => d.classList.toggle('is-on', i === idx));
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === n - 1;
    };

    const go = (next) => {
      if (next < 0 || next > n - 1) return;
      if (next !== idx) flip(null);
      idx = next;
      layout();
    };

    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        if (i === idx) {
          const isFlipped = card.querySelector('.fan-flip-card').classList.contains('flipped');
          flip(isFlipped ? null : i);
        } else {
          go(i);
        }
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', () => go(idx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(idx + 1));

    stage.setAttribute('tabindex', '0');
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    });

    /* 拖拽 / 横向滚轮切换 */
    let downX = null;
    let moved = false;
    stage.addEventListener('pointerdown', (e) => { downX = e.clientX; moved = false; });
    stage.addEventListener('pointermove', (e) => {
      if (downX === null) return;
      if (Math.abs(e.clientX - downX) > 54) {
        moved = true;
        go(idx + (e.clientX < downX ? 1 : -1));
        downX = null;
      }
    });
    stage.addEventListener('pointerup', () => { downX = null; });
    stage.addEventListener('pointercancel', () => { downX = null; });
    stage.addEventListener('click', (e) => {
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
    }, true);

    let lastWheel = 0;
    stage.addEventListener('wheel', (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
      if (!d) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel < 340 || Math.abs(d) < 8) return;
      lastWheel = now;
      go(idx + (d > 0 ? 1 : -1));
    }, { passive: false });

    go(0);

    let rzT = null;
    window.addEventListener('resize', () => {
      clearTimeout(rzT);
      rzT = setTimeout(layout, 120);
    });
  }

  /* ---------- beyond work · 小红书滑轨 ---------- */
  const xhs = document.querySelector('[data-xhs]');
  if (xhs) {
    const prog = document.querySelector('[data-xhs-prog]');

    const updateProg = () => {
      if (!prog) return;
      xhs.classList.toggle('is-scrolled', xhs.scrollLeft > 4);
      const max = xhs.scrollWidth - xhs.clientWidth;
      if (max <= 0) { prog.style.width = '100%'; return; }
      prog.style.width = `${Math.max((xhs.scrollLeft / max) * 100, 8)}%`;
    };

    xhs.addEventListener('scroll', updateProg, { passive: true });

    let down = false;
    let startX = 0;
    let startLeft = 0;
    let dragged = false;

    xhs.addEventListener('pointerdown', (e) => {
      down = true; dragged = false;
      startX = e.clientX;
      startLeft = xhs.scrollLeft;
      xhs.classList.add('grabbing');
    });
    xhs.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) {
        dragged = true;
        e.preventDefault();
        xhs.scrollLeft = startLeft - dx * 1.4;
      }
    });
    const endDrag = () => {
      down = false;
      xhs.classList.remove('grabbing');
    };
    xhs.addEventListener('pointerup', endDrag);
    xhs.addEventListener('pointerleave', endDrag);
    xhs.addEventListener('pointercancel', endDrag);
    xhs.addEventListener('click', (e) => {
      if (dragged) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    updateProg();
    window.addEventListener('resize', updateProg);
  }

  /* ---------- selected work：点击展开详情 ---------- */
  const workIndex = document.querySelector('[data-work-index]');
  if (workIndex) {
    const items = [...workIndex.querySelectorAll('[data-work-item]')];
    const heads = items.map((item) => item.querySelector('.wi-head'));

    const setOpen = (item, open) => {
      const head = item.querySelector('.wi-head');
      const panel = item.querySelector('.wi-panel');
      item.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      panel.querySelectorAll('a').forEach((a) => {
        if (open) a.removeAttribute('tabindex');
        else a.setAttribute('tabindex', '-1');
      });
    };

    items.forEach((item) => {
      setOpen(item, false);
      item.querySelector('.wi-head').addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        items.forEach((other) => {
          if (other !== item) setOpen(other, false);
        });
        setOpen(item, willOpen);
      });
    });

    /* 键盘：↑ ↓ 在行间移动，Home / End 跳到首末行 */
    workIndex.addEventListener('keydown', (e) => {
      const i = heads.indexOf(document.activeElement);
      if (i < 0) return;
      let next = -1;
      if (e.key === 'ArrowDown') next = Math.min(i + 1, heads.length - 1);
      else if (e.key === 'ArrowUp') next = Math.max(i - 1, 0);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = heads.length - 1;
      if (next >= 0 && next !== i) {
        e.preventDefault();
        heads[next].focus();
      }
    });
  }

  /* ---------- year ---------- */
  const y = document.querySelector('.footer .mono');
  if (y) y.textContent = `© ${new Date().getFullYear()} Ziyue Zhang · 张子玥`;
})();
