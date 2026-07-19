const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const html = fs.readFileSync("index.html", "utf8");
const script = fs.readFileSync("script.js", "utf8");

test("hero CTA and navigation point to real sections", () => {
  assert.match(html, /<a class="hero-cta" href="#capture-systems">/);
  assert.match(html, /id="technology"/);
  assert.match(html, /id="capture-systems"/);
  assert.match(html, /id="final-cta"/);
});

test("contact and footer copy stay within the active language", () => {
  const englishStart = script.indexOf("    en: {");
  const chineseStart = script.indexOf("    cn: {");
  const dictionaryEnd = script.indexOf("\n  };", chineseStart);
  const english = script.slice(englishStart, chineseStart);
  const chinese = script.slice(chineseStart, dictionaryEnd);

  assert.match(english, /title: "Partnership Inquiry"/);
  assert.match(english, /projectPlaceholder: "Select a project type"/);
  assert.match(english, /success: "We have received your inquiry and will contact you shortly\."/);
  assert.match(english, /copyright: "© DeepRank Tech\. All rights reserved\."/);
  assert.match(chinese, /title: "合作咨询"/);
  assert.match(chinese, /projectPlaceholder: "请选择项目类型"/);
  assert.match(chinese, /success: "已收到您的需求，我们会尽快联系您。"/);
  assert.match(chinese, /copyright: "© DeepRank Tech\. 版权所有。"/);
  assert.match(script, /document\.documentElement\.lang = lang === "cn" \? "zh-CN" : "en"/);
  assert.match(script, /renderRuntimeI18n\(\)/);
});

test("mobile menu exposes accessible controls and close paths", () => {
  assert.match(html, /data-mobile-menu-toggle/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="siteNavigation"/);
  assert.match(html, /id="siteNavigation"/);
  assert.match(script, /mobileMenuLinks\.forEach\(\(link\) => link\.addEventListener\("click"/);
  assert.match(script, /event\.key !== "Escape" \|\| !mobileMenuOpen/);
  assert.match(script, /document\.addEventListener\("pointerdown"/);
  assert.match(script, /mobileMenuToggle\.setAttribute\("aria-expanded", String\(isOpen\)\)/);
  assert.match(script, /siteNav\.inert = !isOpen/);
});

test("canvas animation only sends finite gradient coordinates", () => {
  const runtime = createCanvasRuntime({ width: 390, height: 844 });
  runtime.runFrames(600);
  assert.ok(runtime.gradientCalls > 0, "expected animated flow gradients to render");
});

test("canvas pauses at zero size, resumes after resize, and respects reduced motion", () => {
  const runtime = createCanvasRuntime({ width: 0, height: 0 });
  assert.equal(runtime.galaxy.canvasReady, false);
  assert.equal(runtime.galaxy.running, false);
  assert.equal(runtime.hasScheduledFrame, false);

  runtime.setSize(768, 1024);
  runtime.dispatchWindow("resize");
  runtime.runTimers();
  assert.equal(runtime.galaxy.canvasReady, true);
  assert.equal(runtime.galaxy.running, true);
  runtime.runFrames(120);

  runtime.setHidden(true);
  runtime.dispatchDocument("visibilitychange");
  assert.equal(runtime.galaxy.running, false);
  assert.equal(runtime.hasScheduledFrame, false);
  runtime.setHidden(false);
  runtime.dispatchDocument("visibilitychange");
  assert.equal(runtime.galaxy.running, true);
  runtime.runFrames(1);

  const reduced = createCanvasRuntime({ width: 390, height: 844, reducedMotion: true });
  assert.equal(reduced.galaxy.canvasReady, true);
  assert.equal(reduced.galaxy.running, false);
  assert.equal(reduced.hasScheduledFrame, false);
});

test("canvas visibility and resize lifecycle rebuilds particles only when metrics change", (context) => {
  const runtime = createCanvasRuntime({ width: 1280, height: 720 });
  const initialRebuilds = runtime.galaxy.particleRebuildCount;
  const initialRandomCalls = runtime.randomCalls;

  runtime.setHidden(true);
  runtime.dispatchDocument("visibilitychange");
  assert.equal(runtime.galaxy.particleRebuildCount, initialRebuilds);
  assert.equal(runtime.randomCalls, initialRandomCalls);

  runtime.setHidden(false);
  runtime.dispatchDocument("visibilitychange");
  assert.equal(runtime.galaxy.particleRebuildCount, initialRebuilds);
  assert.equal(runtime.randomCalls, initialRandomCalls);

  runtime.setHidden(true);
  runtime.dispatchDocument("visibilitychange");
  runtime.setSize(1024, 768);
  runtime.setHidden(false);
  runtime.dispatchDocument("visibilitychange");
  assert.equal(runtime.galaxy.particleRebuildCount, initialRebuilds + 1);
  assert.ok(runtime.randomCalls > initialRandomCalls);

  const beforeBurstRebuilds = runtime.galaxy.particleRebuildCount;
  const beforeBurstRandomCalls = runtime.randomCalls;
  for (let index = 0; index < 20; index += 1) {
    runtime.setSize(900 + index, 700 + index);
    runtime.dispatchWindow("resize");
  }
  assert.equal(runtime.galaxy.particleRebuildCount, beforeBurstRebuilds);
  assert.equal(runtime.pendingTimerCount, 1);
  runtime.runTimers();
  assert.equal(runtime.galaxy.particleRebuildCount, beforeBurstRebuilds + 1);
  assert.ok(runtime.randomCalls > beforeBurstRandomCalls);
  assert.equal(runtime.pendingTimerCount, 0);
  context.diagnostic(
    JSON.stringify({
      initial: { rebuilds: initialRebuilds, randomCalls: initialRandomCalls },
      hidden: { rebuildDelta: 0, randomDelta: 0 },
      visibleUnchanged: { rebuildDelta: 0, randomDelta: 0 },
      visibleChanged: {
        rebuildDelta: 1,
        randomDelta: beforeBurstRandomCalls - initialRandomCalls,
      },
      resizeBurst: {
        events: 20,
        rebuildDelta: 1,
        randomDelta: runtime.randomCalls - beforeBurstRandomCalls,
      },
    }),
  );
});

function createCanvasRuntime({ width, height, reducedMotion = false }) {
  let rectWidth = width;
  let rectHeight = height;
  let scheduledFrame = null;
  let gradientCalls = 0;
  let randomCalls = 0;
  let randomSeed = 123456789;
  let nextTimerId = 1;
  const timers = new Map();
  const windowListeners = new Map();
  const documentListeners = new Map();
  const noop = () => {};
  const gradient = { addColorStop: noop };
  const classList = { add: noop, remove: noop, toggle: noop };
  const math = Object.create(Math);

  math.random = () => {
    randomCalls += 1;
    randomSeed = (1664525 * randomSeed + 1013904223) >>> 0;
    return randomSeed / 2 ** 32;
  };

  const context = {
    setTransform: noop,
    clearRect: noop,
    save: noop,
    restore: noop,
    beginPath: noop,
    arc: noop,
    fill: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    createRadialGradient: (...coordinates) => {
      assert.ok(coordinates.every(Number.isFinite), "radial gradient coordinates must be finite");
      return gradient;
    },
    createLinearGradient: (...coordinates) => {
      assert.ok(coordinates.every(Number.isFinite), "linear gradient coordinates must be finite");
      gradientCalls += 1;
      return gradient;
    },
  };

  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    getBoundingClientRect: () => ({ width: rectWidth, height: rectHeight }),
  };

  const document = {
    activeElement: null,
    hidden: false,
    title: "",
    body: { classList },
    documentElement: { classList, lang: "en", style: { setProperty: noop } },
    getElementById: () => canvas,
    querySelector: (selector) => (selector === 'meta[name="description"]' ? { setAttribute: noop } : null),
    querySelectorAll: () => [],
    addEventListener: (type, listener) => {
      const listeners = documentListeners.get(type) || [];
      listeners.push(listener);
      documentListeners.set(type, listeners);
    },
  };

  const window = {
    devicePixelRatio: 2,
    matchMedia: (query) => ({
      matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
      addEventListener: noop,
    }),
    addEventListener: (type, listener) => {
      const listeners = windowListeners.get(type) || [];
      listeners.push(listener);
      windowListeners.set(type, listeners);
    },
    requestAnimationFrame: (callback) => {
      assert.equal(scheduledFrame, null, "only one animation frame may be scheduled");
      scheduledFrame = callback;
      return 1;
    },
    cancelAnimationFrame: () => {
      scheduledFrame = null;
    },
    setTimeout: (callback) => {
      const timerId = nextTimerId;
      nextTimerId += 1;
      timers.set(timerId, callback);
      return timerId;
    },
    clearTimeout: (timerId) => timers.delete(timerId),
  };

  const sandbox = {
    window,
    document,
    localStorage: { getItem: () => null, setItem: noop },
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    console,
    Math: math,
    FormData: class {},
    fetch: async () => ({ ok: true, json: async () => ({}) }),
  };

  vm.runInNewContext(script, sandbox, { filename: "script.js" });

  return {
    get galaxy() {
      return window.__deepRankGalaxy;
    },
    get gradientCalls() {
      return gradientCalls;
    },
    get randomCalls() {
      return randomCalls;
    },
    get pendingTimerCount() {
      return timers.size;
    },
    get hasScheduledFrame() {
      return typeof scheduledFrame === "function";
    },
    setSize(nextWidth, nextHeight) {
      rectWidth = nextWidth;
      rectHeight = nextHeight;
    },
    setHidden(hidden) {
      document.hidden = hidden;
    },
    dispatchWindow(type) {
      (windowListeners.get(type) || []).forEach((listener) => listener());
    },
    dispatchDocument(type) {
      (documentListeners.get(type) || []).forEach((listener) => listener());
    },
    runTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach((callback) => callback());
    },
    runFrames(count) {
      for (let frame = 1; frame <= count; frame += 1) {
        const callback = scheduledFrame;
        scheduledFrame = null;
        assert.equal(typeof callback, "function", `animation stopped before frame ${frame}`);
        callback(frame * 16.67);
      }
    },
  };
}
