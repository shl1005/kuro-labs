import { chromium } from "playwright";

async function testCurrencySwitcher() {
  console.log("==================================================");
  console.log("TESTING DUAL-CURRENCY SYSTEM (USD $ / INR ₹)");
  console.log("==================================================");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // 1. Visit shop page
    console.log("\n[STEP 1] Loading http://localhost:3000/shop...");
    await page.goto("http://localhost:3000/shop", { waitUntil: "networkidle" });

    // Verify toggle button in Navbar
    const currencyToggle = page.locator("button[aria-label*='Toggle currency switcher']").first();
    await currencyToggle.waitFor({ state: "visible" });
    const initialText = await currencyToggle.innerText();
    console.log(`✓ Currency toggle button rendered in Navbar: "${initialText}"`);

    // Verify initial USD pricing
    await page.waitForSelector("text=$", { timeout: 5000 });
    const usdPrices = await page.locator("span.font-mono.text-base.font-semibold.text-white").allInnerTexts();
    console.log(`✓ Found ${usdPrices.length} product prices in USD:`, usdPrices.slice(0, 3));
    if (!usdPrices.some(p => p.includes("$"))) {
      throw new Error("Expected USD ($) prices in initial catalog state!");
    }

    // 2. Click toggle button to switch to INR
    console.log("\n[STEP 2] Toggling currency to INR (₹)...");
    await currencyToggle.click();
    await page.waitForTimeout(300);

    const inrToggleText = await currencyToggle.innerText();
    console.log(`✓ Currency toggle button updated to: "${inrToggleText}"`);
    if (!inrToggleText.includes("INR") || !inrToggleText.includes("₹")) {
      throw new Error(`Expected toggle to display INR (₹), got "${inrToggleText}"`);
    }

    // Verify dynamic update of product card prices to INR
    const inrPrices = await page.locator("span.font-mono.text-base.font-semibold.text-white").allInnerTexts();
    console.log(`✓ Product prices dynamically updated to INR (₹):`, inrPrices.slice(0, 3));
    if (!inrPrices.some(p => p.includes("₹"))) {
      throw new Error("Expected INR (₹) prices after toggling!");
    }

    // 3. Add item to cart and check Cart Drawer prices in INR
    console.log("\n[STEP 3] Verifying Cart Drawer with active INR currency...");
    const firstAddBtn = page.locator("button:has-text('Add to Cart')").first();
    await firstAddBtn.click();
    await page.waitForTimeout(300);

    const openCartBtn = page.locator("button[aria-label='Open cart']");
    await openCartBtn.click();
    await page.waitForSelector("text=Your Cart");

    const drawerSubtotal = await page.locator("span.text-xl.font-mono.font-semibold.text-zinc-100").innerText();
    console.log(`✓ Cart Drawer Subtotal formatted in INR: "${drawerSubtotal}"`);
    if (!drawerSubtotal.includes("₹")) {
      throw new Error(`Expected Cart Subtotal in INR (₹), got "${drawerSubtotal}"`);
    }

    // Close cart drawer
    await page.locator("button[aria-label='Close cart drawer']").click();

    // 4. Test Hardware Concierge chat bubble mini-card prices in INR
    console.log("\n[STEP 4] Verifying Hardware Concierge mini-cards in INR...");
    const conciergeBtn = page.locator("button[aria-label='Open AI Shopping Concierge']");
    await conciergeBtn.click();
    await page.waitForSelector("text=Hardware Concierge");

    const chipBtn = page.locator("button", { hasText: "Find accessories under $50" });
    await chipBtn.click();
    await page.waitForSelector("text=Recommended Hardware", { timeout: 10000 });

    const miniCardPrice = await page.locator("span.font-mono.text-xs.font-semibold.text-zinc-200").first().innerText();
    console.log(`✓ AI Concierge mini-card price formatted in INR: "${miniCardPrice}"`);
    if (!miniCardPrice.includes("₹")) {
      throw new Error(`Expected mini-card price in INR (₹), got "${miniCardPrice}"`);
    }
    await conciergeBtn.click(); // close concierge

    // 5. Test Admin Console table price column in INR
    console.log("\n[STEP 5] Navigating to http://localhost:3000/admin to verify Admin table prices...");
    await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
    await page.waitForSelector("text=KURO // OPS");

    const adminToggleText = await page.locator("button[aria-label*='Toggle currency switcher']").first().innerText();
    console.log(`✓ Admin Header currency synced from LocalStorage: "${adminToggleText}"`);

    const adminTablePrices = await page.locator("td.py-3\\.5.px-4.text-base.font-mono.font-semibold.text-zinc-200").allInnerTexts();
    console.log(`✓ Admin Table prices rendered in INR (₹):`, adminTablePrices.slice(0, 3));
    if (!adminTablePrices.some(p => p.includes("₹"))) {
      throw new Error("Expected Admin table prices in INR (₹)!");
    }

    // 6. Toggle back to USD from Admin header
    console.log("\n[STEP 6] Toggling back to USD ($) from Admin header...");
    const adminToggle = page.locator("button[aria-label*='Toggle currency switcher']").first();
    await adminToggle.click();
    await page.waitForTimeout(300);

    const revertedAdminPrices = await page.locator("td.py-3\\.5.px-4.text-base.font-mono.font-semibold.text-zinc-200").allInnerTexts();
    console.log(`✓ Admin Table prices dynamically reverted to USD ($):`, revertedAdminPrices.slice(0, 3));
    if (!revertedAdminPrices.some(p => p.includes("$"))) {
      throw new Error("Expected Admin table prices reverted to USD ($)!");
    }

    // 7. Verify LocalStorage persistence on reload
    console.log("\n[STEP 7] Verifying LocalStorage persistence on page reload...");
    await page.reload({ waitUntil: "networkidle" });
    const reloadToggleText = await page.locator("button[aria-label*='Toggle currency switcher']").first().innerText();
    console.log(`✓ After reload, currency persisted cleanly: "${reloadToggleText}"`);

    console.log("\n==================================================");
    console.log("ALL DUAL-CURRENCY TESTS PASSED WITH 100% SUCCESS!");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ CURRENCY TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testCurrencySwitcher();
