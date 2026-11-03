/* McDuffers Virtual Golf — vanilla JS, no dependencies.
   Every feature is its own init function and guards for the elements it needs,
   so one missing element on a page can never stop the rest of the script. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------
     Header: shadow on scroll, mobile drawer, mobile quick-action bar
     ------------------------------------------------------------------ */
  function initHeader() {
    const header = $(".site-header");
    const toggle = $("[data-nav-toggle]");
    const nav = $("#site-nav");
    if (!header || !toggle || !nav) return;

    const dock = $("[data-dock]");
    const desktopMq = window.matchMedia("(min-width: 993px)");
    // While the drawer is open everything behind it is inert: no tabbing into the page, no screen reader reach.
    const behind = $$("main, .site-footer, .rail, [data-dock]");

    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 8);
      if (dock) dock.classList.toggle("is-visible", y > 240);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const setNav = (open) => {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      behind.forEach((el) => (el.inert = open));
      if (open) requestAnimationFrame(() => $("a", nav)?.focus({ preventScroll: true }));
    };
    toggle.addEventListener("click", () => setNav(toggle.getAttribute("aria-expanded") !== "true"));
    $$("[data-nav-close]").forEach((el) => el.addEventListener("click", () => setNav(false)));
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        setNav(false);
        toggle.focus();
      }
    });
    desktopMq.addEventListener("change", (e) => e.matches && setNav(false));
  }

  /* ------------------------------------------------------------------
     About submenu
     ------------------------------------------------------------------ */
  function initSubmenus() {
    const subs = $$(".has-sub");
    if (!subs.length) return;
    const setSub = (li, open) => {
      li.classList.toggle("is-open", open);
      $("[data-sub-toggle]", li).setAttribute("aria-expanded", String(open));
    };
    subs.forEach((li) =>
      $("[data-sub-toggle]", li).addEventListener("click", () => setSub(li, !li.classList.contains("is-open")))
    );
    document.addEventListener("click", (e) => subs.forEach((li) => !li.contains(e.target) && setSub(li, false)));
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      subs.forEach((li) => {
        if (!li.classList.contains("is-open")) return;
        setSub(li, false);
        $("[data-sub-toggle]", li).focus();
      });
    });
  }

  /* ------------------------------------------------------------------
     Dialogs (testimonial form) + gallery lightbox with prev / next
     ------------------------------------------------------------------ */
  function initDialogs() {
    $$("[data-dialog-open]").forEach((btn) =>
      btn.addEventListener("click", () => document.getElementById(btn.dataset.dialogOpen)?.showModal())
    );
    $$("dialog").forEach((d) =>
      d.addEventListener("click", (e) => {
        if (e.target === d || e.target.closest("[data-dialog-close]")) d.close();
      })
    );

    const lb = $("[data-lightbox]");
    if (!lb) return;
    const big = $("img", lb);
    const count = $("[data-lb-count]", lb);
    const items = $$("[data-full]");
    let i = 0;

    const show = (n) => {
      i = (n + items.length) % items.length;
      big.src = items[i].dataset.full;
      big.alt = items[i].dataset.alt || "";
      count.textContent = items.length > 1 ? `${i + 1} / ${items.length}` : "";
      lb.classList.toggle("is-single", items.length < 2);
    };
    items.forEach((btn, n) =>
      btn.addEventListener("click", () => {
        show(n);
        lb.showModal();
      })
    );
    $("[data-lb-prev]", lb)?.addEventListener("click", () => show(i - 1));
    $("[data-lb-next]", lb)?.addEventListener("click", () => show(i + 1));
    lb.addEventListener("keydown", (e) => {
      if (items.length < 2 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      show(i + (e.key === "ArrowRight" ? 1 : -1));
      e.preventDefault();
    });
  }

  /* ------------------------------------------------------------------
     Forms
     Posts url-encoded to data-endpoint (default "/", which is what
     Netlify Forms expects). Point data-endpoint at Formspree etc. if the
     site is hosted somewhere else.
     ------------------------------------------------------------------ */
  function initForms() {
    $$("form[data-form]").forEach((form) => {
      const status = $("[data-status]", form);
      const submit = $('[type="submit"]', form);
      if (!status || !submit) return;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        submit.disabled = true;
        form.setAttribute("aria-busy", "true");
        status.className = "form__status";
        status.textContent = "Sending...";
        try {
          const res = await fetch(form.dataset.endpoint || "/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(new FormData(form)).toString(),
          });
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          status.classList.add("is-ok");
          status.textContent = form.dataset.success || "Sent.";
        } catch (err) {
          status.classList.add("is-error");
          status.textContent = "Could not send. Call 716-269-9003 instead.";
        } finally {
          submit.disabled = false;
          form.removeAttribute("aria-busy");
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Book now: plan cards load a category into the Acuity iframe (link
     target = iframe name). On click: mark the chosen plan, scroll to the
     scheduler. Lives outside the slider code so it runs on this page.
     ------------------------------------------------------------------ */
  function initBookNow() {
    const scheduler = document.getElementById("schedule");
    const plans = $$("[data-plan]");
    if (!scheduler || !plans.length) return;
    plans.forEach((card) =>
      card.addEventListener("click", () => {
        plans.forEach((c) => c.removeAttribute("aria-current"));
        card.setAttribute("aria-current", "true");
        scheduler.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
      })
    );
  }

  /* ------------------------------------------------------------------
     Footer year + scroll reveal (progressive enhancement: without JS, or
     with reduced motion, nothing is ever hidden)
     ------------------------------------------------------------------ */
  function initMisc() {
    $$("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));

    const items = $$("[data-reveal]");
    if (!items.length || reduceMotion.matches || !("IntersectionObserver" in window)) return;

    // anything already on screen skips the animation, so there is no flash on load
    items.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add("is-in");
    });
    document.documentElement.classList.add("reveal-on");

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    items.forEach((el) => !el.classList.contains("is-in") && io.observe(el));
  }

  /* ------------------------------------------------------------------
     Hero slider
     - looping, drag / swipe, arrows, dots, keyboard
     - autoplay is driven by the active dot's progress animation
       (animationend -> next), so pause/resume keeps the progress
     ------------------------------------------------------------------ */
  function initSlider() {
    const root = $("[data-slider]");
    if (!root) return;

    const viewport = $("[data-viewport]", root);
    const slides = $$(".slide", viewport);
    const dotsWrap = $("[data-dots]", root);
    const playBtn = $("[data-toggle]", root);
    const n = slides.length;
    if (!viewport || !dotsWrap || !playBtn || n < 2) return;

    let index = 0;
    let userPaused = reduceMotion.matches; // respect reduced motion: no autoplay until asked
    let hoverPaused = false;
    let focusPaused = false;
    let hiddenPaused = document.hidden;
    let dragging = false;

    // dots
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot";
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.innerHTML = '<span class="dot__pill"><span class="dot__fill"></span></span>';
      b.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(b);
      return b;
    });

    const circular = (i) => {
      // shortest signed distance from the current slide, in slides
      let d = (((i - index) % n) + n) % n;
      if (d > n / 2) d -= n;
      return d;
    };

    const render = (instant = false) => {
      slides.forEach((slide, i) => {
        const off = circular(i);
        const prev = Number(slide.style.getPropertyValue("--off") || 0);
        // a slide that wraps around the loop jumps while off screen: no animation
        const jump = instant || Math.abs(off - prev) > 1;
        slide.classList.toggle("no-anim", jump);
        slide.style.setProperty("--off", off);
        slide.setAttribute("aria-hidden", off === 0 ? "false" : "true");
        slide.inert = off !== 0;
      });
      dots.forEach((d, i) => {
        const active = i === index; // a newly active dot restarts its own progress animation
        d.classList.toggle("is-active", active);
        if (active) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
      if (slides.some((s) => s.classList.contains("no-anim"))) {
        // re-enable transitions on the next frame
        requestAnimationFrame(() =>
          requestAnimationFrame(() => slides.forEach((s) => s.classList.remove("no-anim")))
        );
      }
    };

    const goTo = (i) => {
      const next = ((i % n) + n) % n;
      if (next === index) return;
      index = next;
      render();
    };

    const updatePaused = () => {
      const paused = userPaused || hoverPaused || focusPaused || hiddenPaused || dragging;
      root.classList.toggle("is-paused", paused);
      root.classList.toggle("is-user-paused", userPaused);
      playBtn.setAttribute("aria-label", userPaused ? "Play slideshow" : "Pause slideshow");
      viewport.setAttribute("aria-live", userPaused || focusPaused ? "polite" : "off");
    };

    // autoplay: advance when the active dot finishes filling
    dotsWrap.addEventListener("animationend", (e) => {
      if (e.animationName === "dot-fill" && e.target.closest(".dot.is-active")) goTo(index + 1);
    });

    playBtn.addEventListener("click", () => {
      userPaused = !userPaused;
      updatePaused();
    });

    // pause while pointer is over / focus is inside (WCAG 2.2.2)
    root.addEventListener("mouseenter", () => ((hoverPaused = true), updatePaused()));
    root.addEventListener("mouseleave", () => ((hoverPaused = false), updatePaused()));
    root.addEventListener("focusin", (e) => {
      if (e.target.matches(":focus-visible")) {
        focusPaused = true;
        updatePaused();
      }
    });
    root.addEventListener("focusout", () => ((focusPaused = false), updatePaused()));
    document.addEventListener("visibilitychange", () => {
      hiddenPaused = document.hidden;
      updatePaused();
    });

    $("[data-prev]", root).addEventListener("click", () => goTo(index - 1));
    $("[data-next]", root).addEventListener("click", () => goTo(index + 1));
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "ArrowRight") goTo(index + 1);
      else return;
      e.preventDefault();
    });

    /* ---- drag / swipe (pointer events: mouse, touch, pen) ---- */
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let dx = 0;
    let tracking = false;
    let pid = null;
    let didDrag = false;

    viewport.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      tracking = true;
      dragging = false;
      didDrag = false;
      pid = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startT = performance.now();
      dx = 0;
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!tracking || e.pointerId !== pid) return;
      const mx = e.clientX - startX;
      const my = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(mx) < 8 || Math.abs(mx) < Math.abs(my)) return;
        dragging = true;
        didDrag = true;
        viewport.classList.add("is-dragging");
        viewport.setPointerCapture(pid);
        updatePaused();
      }
      const w = viewport.clientWidth;
      dx = Math.max(-w, Math.min(w, mx));
      viewport.style.setProperty("--drag", dx + "px");
    });

    const endDrag = (e) => {
      if (!tracking || (e && e.pointerId !== pid)) return;
      tracking = false;
      if (!dragging) return;
      const w = viewport.clientWidth;
      const fast = performance.now() - startT < 280 && Math.abs(dx) > 36;
      const far = Math.abs(dx) > w * 0.18;
      viewport.classList.remove("is-dragging");
      viewport.style.removeProperty("--drag");
      dragging = false;
      if ((fast || far) && dx !== 0) goTo(index + (dx < 0 ? 1 : -1));
      else render(); // snap back
      updatePaused();
    };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("dragstart", (e) => e.preventDefault());
    viewport.addEventListener(
      "click",
      (e) => {
        if (!didDrag) return;
        e.preventDefault();
        e.stopPropagation();
        didDrag = false;
      },
      true
    );

    // init
    render(true);
    updatePaused();
  }

  initHeader();
  initSubmenus();
  initDialogs();
  initForms();
  initBookNow();
  initMisc();
  initSlider();
})();
