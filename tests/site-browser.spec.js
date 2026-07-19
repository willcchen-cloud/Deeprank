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

  await page.locator('.hero-cta[href="#capture-systems"]').click();
  await expect(page).toHaveURL(/#capture-systems$/);
  await expect
    .poll(() => page.locator("#capture-systems").evaluate((element) => element.getBoundingClientRect().top))
    .toBeLessThan(720);
  const targetPosition = await page.locator("#capture-systems").evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    bottom: element.getBoundingClientRect().bottom,
    scrollY: window.scrollY,
  }));
  expect(targetPosition.bottom).toBeGreaterThan(0);
  expect(targetPosition.scrollY).toBeGreaterThan(0);

  const modal = page.locator("[data-contact-modal]");
  const firstCta = page.locator("[data-contact-open]").nth(0);
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

  const secondCta = page.locator("[data-contact-open]").nth(1);
  await secondCta.focus();
  await page.keyboard.press("Enter");
  await expect(modal).toHaveClass(/is-open/);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await expect(secondCta).toBeFocused();

  expect(await page.evaluate(() => window.__nonFiniteCanvasCalls)).toEqual([]);
  expect(requests.some((url) => url.endsWith("/favicon.svg"))).toBe(true);
  expect(requests.some((url) => url.endsWith("/favicon.ico"))).toBe(false);
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
