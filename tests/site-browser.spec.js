const { expect, test } = require("@playwright/test");

async function instrumentPage(page, viewport) {
  await page.setViewportSize(viewport);
  const errors = [];
  const requests = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("request", (request) => requests.push(request.url()));
  await page.addInitScript(() => {
    window.__nonFiniteCanvasCalls = [];
    for (const [method, coordinateCount] of [
      ["createLinearGradient", 4],
      ["createRadialGradient", 6],
    ]) {
      const original = CanvasRenderingContext2D.prototype[method];
      CanvasRenderingContext2D.prototype[method] = function patchedGradient(...args) {
        const coordinates = args.slice(0, coordinateCount);
        if (!coordinates.every(Number.isFinite)) {
          window.__nonFiniteCanvasCalls.push({ method, coordinates });
          throw new TypeError(`${method} received a non-finite coordinate`);
        }
        return original.apply(this, args);
      };
    }
  });
  await page.goto("/", { waitUntil: "networkidle" });
  return { errors, requests };
}

async function expectMenuClosed(page) {
  const nav = page.locator("[data-mobile-menu]");
  await expect(page.locator("[data-mobile-menu-toggle]")).toHaveAttribute("aria-expanded", "false");
  await expect(nav).toHaveAttribute("aria-hidden", "true");
  await expect(nav).toHaveAttribute("inert", "");
  await expect(nav).not.toHaveClass(/is-open/);
}

test("desktop CTA, modal state, focus loop, language, and console remain correct", async ({ page }) => {
  const { errors, requests } = await instrumentPage(page, { width: 1280, height: 720 });

  for (const [path, label] of [
    ["brand.home", "DeepRank homepage"],
    ["hero.sectionLabel", "DeepRank homepage introduction"],
    ["hero.coordinatesLabel", "DeepRank data production capabilities"],
    ["pipeline.label", "Data production workflow"],
    ["quality.label", "Quality control system"],
    ["quality.statusLabel", "Delivery status"],
    ["confidential.featuresLabel", "Confidential delivery controls"],
    ["confidential.flowLabel", "Secure delivery flow"],
    ["final.servicesLabel", "DeepRank services"],
  ]) {
    await expect(page.locator(`[data-i18n-aria-label="${path}"]`)).toHaveAttribute("aria-label", label);
  }
  for (const label of [
    "DeepRank data production capabilities",
    "Quality control system",
    "Delivery status",
    "Confidential delivery controls",
  ]) {
    await expect(page.getByRole("group", { name: label })).toHaveCount(1);
  }
  await page.locator(".lang-toggle").click();
  for (const label of ["深序科技数据生产能力", "质量控制体系", "交付状态", "保密交付控制措施"]) {
    await expect(page.getByRole("group", { name: label })).toHaveCount(1);
  }
  await page.locator(".lang-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await expect(page.locator("[data-contact-open]")).toHaveCount(1);
  await page.locator('.hero-cta[href="#technology"]').click();
  await expect(page).toHaveURL(/#technology$/);
  await expect
    .poll(() => page.locator("#technology").evaluate((element) => element.getBoundingClientRect().top))
    .toBeLessThan(720);
  const targetPosition = await page.locator("#technology").evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    bottom: element.getBoundingClientRect().bottom,
    scrollY: window.scrollY,
  }));
  expect(targetPosition.bottom).toBeGreaterThan(0);
  expect(targetPosition.scrollY).toBeGreaterThan(0);

  const modal = page.locator("[data-contact-modal]");
  const firstCta = page.locator("[data-contact-open]").nth(0);
  await expect(firstCta).toContainText("Contact DeepRank");
  await firstCta.scrollIntoViewIfNeeded();
  await firstCta.focus();
  await page.keyboard.press("Enter");
  await expect(modal).toHaveClass(/is-open/);
  await expect(modal).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator(".hero")).toHaveAttribute("inert", "");
  await expect(page.locator(".page-flow")).toHaveAttribute("inert", "");
  await expect(page.locator("body")).toHaveClass(/has-contact-modal/);
  expect(await page.evaluate(() => document.querySelector("[data-contact-modal]").contains(document.activeElement))).toBe(true);

  await page.keyboard.press("Escape");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(240);
  await expect(modal).not.toHaveAttribute("hidden", "");
  await expect(modal).toHaveClass(/is-open/);
  await expect(modal).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator("body")).toHaveClass(/has-contact-modal/);

  const closeButton = page.locator(".contact-modal__close");
  const submitButton = page.locator("[data-contact-submit]");
  await submitButton.focus();
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(submitButton).toBeFocused();

  await expect(page.locator("#contactModalTitle")).toHaveText("Partnership Inquiry");
  await page.locator(".lang-toggle").evaluate((button) => button.click());
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator("#contactModalTitle")).toHaveText("合作咨询");
  await expect(page.locator("[data-contact-submit] span")).toHaveText("提交咨询");
  await expect(firstCta).toContainText("联系深序科技");
  await expect(page.locator('.hero-cta[href="#technology"]')).toHaveAttribute("href", "#technology");
  for (const [path, label] of [
    ["brand.home", "深序科技首页"],
    ["hero.sectionLabel", "深序科技首页介绍"],
    ["hero.coordinatesLabel", "深序科技数据生产能力"],
    ["pipeline.label", "数据生产流程"],
    ["quality.label", "质量控制体系"],
    ["quality.statusLabel", "交付状态"],
    ["confidential.featuresLabel", "保密交付控制措施"],
    ["confidential.flowLabel", "安全交付流程"],
    ["final.servicesLabel", "深序科技服务范围"],
  ]) {
    await expect(page.locator(`[data-i18n-aria-label="${path}"]`)).toHaveAttribute("aria-label", label);
  }
  expect(await page.locator("#confidential-delivery h2").evaluate((element) => element.innerText.split("\n"))).toEqual([
    "为保密数据",
    "流程而设计",
  ]);
  await page.locator(".lang-toggle").evaluate((button) => button.click());
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await expect(firstCta).toBeFocused();
  await expect(modal).toHaveAttribute("hidden", "");
  await expect(modal).toHaveAttribute("aria-hidden", "true");
  await expect(modal).toHaveAttribute("inert", "");
  await expect(page.locator(".hero")).not.toHaveAttribute("inert", "");
  await expect(page.locator(".page-flow")).not.toHaveAttribute("aria-hidden", "true");

  expect(await page.evaluate(() => window.__nonFiniteCanvasCalls)).toEqual([]);
  expect(requests.some((url) => url.endsWith("/favicon.svg"))).toBe(true);
  expect(requests.some((url) => url.endsWith("/favicon.ico"))).toBe(false);
  expect(errors).toEqual([]);
});

test("confidential delivery stays separated at responsive breakpoints in both languages", async ({ page }) => {
  const { errors } = await instrumentPage(page, { width: 920, height: 1000 });

  for (const width of [641, 768, 900, 920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator("#confidential-delivery").scrollIntoViewIfNeeded();

    for (const language of ["en", "zh-CN"]) {
      await page.locator(".lang-toggle").evaluate((button, expectedLanguage) => {
        if (document.documentElement.lang !== expectedLanguage) button.click();
      }, language);
      await page.waitForTimeout(120);

      const layout = await page.evaluate(() => {
        const copy = document.querySelector(".confidential-copy").getBoundingClientRect();
        const features = document.querySelector(".confidential-features").getBoundingClientRect();
        const flow = document.querySelector(".confidential-flow").getBoundingClientRect();
        const overlapWidth = Math.max(0, Math.min(copy.right, features.right) - Math.max(copy.left, features.left));
        const overlapHeight = Math.max(0, Math.min(copy.bottom, features.bottom) - Math.max(copy.top, features.top));
        return {
          overlapArea: overlapWidth * overlapHeight,
          flowTop: flow.top,
          featuresBottom: features.bottom,
          featuresPosition: getComputedStyle(document.querySelector(".confidential-features")).position,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      expect(layout.overlapArea, `${width}px ${language} copy/features overlap`).toBe(0);
      expect(layout.flowTop, `${width}px ${language} flow order`).toBeGreaterThanOrEqual(layout.featuresBottom - 0.5);
      expect(layout.featuresPosition).toBe("relative");
      expect(layout.overflow).toBeLessThanOrEqual(0);
    }
  }

  expect(errors).toEqual([]);
});

test("mobile capabilities are bilingual while desktop coordinates retain the galaxy layout", async ({ page }) => {
  const { errors } = await instrumentPage(page, { width: 390, height: 844 });
  const points = page.locator(".coordinate-point");
  await expect(points).toHaveCount(6);

  for (const [language, primary, secondary] of [
    ["en", ["UMI Capture", "Ego-view Capture", "Cleaning", "QA", "Annotation", "Delivery"], ["夹抓采集", "第一视角采集", "数据清洗", "质量检测", "数据标注", "成品交付"]],
    ["zh-CN", ["夹抓采集", "第一视角采集", "数据清洗", "质量检测", "数据标注", "成品交付"], ["UMI Capture", "Ego-view Capture", "Cleaning", "QA", "Annotation", "Delivery"]],
  ]) {
    await page.locator(".lang-toggle").evaluate((button, expectedLanguage) => {
      if (document.documentElement.lang !== expectedLanguage) button.click();
    }, language);
    await page.waitForTimeout(60);

    await expect(page.locator(".coordinate-point__label")).toHaveText(primary);
    await expect(page.locator(".coordinate-point__zh")).toHaveText(secondary);
    const mobileLayout = await points.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        const label = element.querySelector(".coordinate-point__label");
        const secondaryLabel = element.querySelector(".coordinate-point__zh");
        return {
          box: { left: box.left, right: box.right, height: box.height },
          labelVisible: getComputedStyle(label).display !== "none" && label.textContent.trim().length > 0,
          secondaryVisible: getComputedStyle(secondaryLabel).display !== "none" && secondaryLabel.textContent.trim().length > 0,
        };
      }),
    );
    expect(mobileLayout.every(({ box, labelVisible, secondaryVisible }) => box.left >= 0 && box.right <= 390.5 && box.height >= 44 && labelVisible && secondaryVisible)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  }

  await points.first().focus();
  await expect(points.first()).toBeFocused();
  await expect(points.first()).toHaveCSS("outline-style", "solid");

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(120);
  const desktopLayout = await points.evaluateAll((elements) =>
    elements.map((element) => ({
      position: getComputedStyle(element).position,
      lineDisplay: getComputedStyle(element.querySelector(".coordinate-point__line")).display,
      textDisplay: getComputedStyle(element.querySelector(".coordinate-point__text")).display,
      secondaryDisplay: getComputedStyle(element.querySelector(".coordinate-point__zh")).display,
    })),
  );
  expect(desktopLayout.every(({ position, lineDisplay, textDisplay, secondaryDisplay }) => position === "absolute" && lineDisplay !== "none" && textDisplay !== "none" && secondaryDisplay === "none")).toBe(true);
  expect(errors).toEqual([]);
});

test("reduced motion leaves content visible and canvas idle", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { errors } = await instrumentPage(page, { width: 390, height: 844 });

  await expect.poll(() => page.evaluate(() => window.__deepRankGalaxy?.canvasReady)).toBe(true);
  expect(await page.evaluate(() => window.__deepRankGalaxy.running)).toBe(false);
  const reveal = await page.locator(".reveal").first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { opacity: style.opacity, transform: style.transform };
  });
  expect(reveal).toEqual({ opacity: "1", transform: "none" });
  expect(await page.evaluate(() => window.__nonFiniteCanvasCalls)).toEqual([]);
  expect(errors).toEqual([]);
});

test("contact form keeps arbitrary server errors private", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (url, options = {}) => {
      if (url !== "/api/contact-leads") return originalFetch(url, options);
      window.__contactFetchCalls = (window.__contactFetchCalls || 0) + 1;
      window.__capturedContactRequest = {
        url,
        method: options.method,
        payload: JSON.parse(options.body),
      };
      return new Response(JSON.stringify({ error: "database stack and internal details" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    };
  });
  const { errors } = await instrumentPage(page, { width: 1280, height: 720 });

  await page.locator("[data-contact-open]").first().click();
  await page.locator("[data-contact-submit]").click();
  await expect(page.locator("[data-contact-feedback]")).toHaveText(
    "Please enter a valid email and provide the project type and requirements.",
  );
  expect(await page.evaluate(() => window.__contactFetchCalls || 0)).toBe(0);

  await page.locator('input[name="email"]').fill("browser-test@example.com");
  await page.locator('input[name="name_company"]').fill("Automated browser test");
  await page.locator('select[name="project_type"]').selectOption("其他");
  await page.locator('textarea[name="message"]').fill("Intercepted locally; do not deliver.");
  await page.locator("[data-contact-submit]").click();

  await expect(page.locator("[data-contact-feedback]")).toHaveText("Submission failed. Please try again later.");
  await expect(page.locator("body")).not.toContainText("database stack and internal details");
  expect(await page.evaluate(() => window.__capturedContactRequest)).toEqual({
    url: "/api/contact-leads",
    method: "POST",
    payload: {
      email: "browser-test@example.com",
      name_company: "Automated browser test",
      project_type: "其他",
      message: "Intercepted locally; do not deliver.",
    },
  });
  expect(await page.evaluate(() => window.__contactFetchCalls)).toBe(1);

  await page.locator(".lang-toggle").evaluate((button) => button.click());
  await expect(page.locator("[data-contact-feedback]")).toHaveText("提交失败，请稍后重试。");
  expect(errors).toEqual([]);
});

test("mobile menu supports immediate Tab and every close path", async ({ page }) => {
  const { errors } = await instrumentPage(page, { width: 390, height: 844 });
  const toggle = page.locator("[data-mobile-menu-toggle]");
  const nav = page.locator("[data-mobile-menu]");
  const firstLink = nav.locator("a").first();

  await toggle.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(firstLink).toBeFocused();
  await expect(nav).toHaveCSS("visibility", "visible");
  await expect(nav).not.toHaveAttribute("inert", "");

  await page.keyboard.press("Escape");
  await expectMenuClosed(page);
  await expect(toggle).toBeFocused();

  await toggle.press("Enter");
  await firstLink.focus();
  await page.mouse.click(8, 300);
  await expectMenuClosed(page);
  expect(await nav.evaluate((element) => element.contains(document.activeElement))).toBe(false);

  await toggle.focus();
  await toggle.press("Enter");
  await firstLink.focus();
  await toggle.evaluate((button) => {
    window.__menuToggleFocusReturns = 0;
    button.addEventListener("focus", () => {
      window.__menuToggleFocusReturns += 1;
    });
  });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#technology$/);
  await expectMenuClosed(page);
  expect(await page.evaluate(() => window.__menuToggleFocusReturns)).toBeGreaterThan(0);
  expect(await nav.evaluate((element) => element.contains(document.activeElement))).toBe(false);

  await toggle.press("Enter");
  await page.locator(".lang-toggle").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expectMenuClosed(page);
  await expect(toggle).toBeFocused();

  await toggle.press("Enter");
  await firstLink.focus();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(nav).not.toHaveAttribute("aria-hidden", /.+/);
  await expect(nav).not.toHaveAttribute("inert", "");
  await expect(firstLink).toBeFocused();
  await expect(toggle).toBeHidden();
  expect(errors).toEqual([]);
});

test("desktop, mobile, and tablet layouts have no horizontal overflow and usable modal", async ({ page }) => {
  const { errors } = await instrumentPage(page, { width: 1280, height: 720 });
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(120);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const [keywordsBox, footerBox] = await Promise.all([
      page.locator(".final-keywords").boundingBox(),
      page.locator(".site-footer").boundingBox(),
    ]);
    expect(keywordsBox).not.toBeNull();
    expect(footerBox).not.toBeNull();
    expect(keywordsBox.y + keywordsBox.height).toBeLessThanOrEqual(footerBox.y);

    const cta = page.locator("[data-contact-open]").first();
    await cta.scrollIntoViewIfNeeded();
    await cta.click();
    const panelBox = await page.locator(".contact-modal__panel").boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox.x).toBeGreaterThanOrEqual(0);
    expect(panelBox.y).toBeGreaterThanOrEqual(0);
    expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewport.width + 0.5);
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(viewport.height + 0.5);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }

  expect(await page.evaluate(() => window.__nonFiniteCanvasCalls)).toEqual([]);
  expect(errors).toEqual([]);
});
