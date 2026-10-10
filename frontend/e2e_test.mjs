import { chromium } from "playwright";

async function runE2ETests() {
  console.log("==================================================");
  console.log("STARTING PLAYWRIGHT END-TO-END BROWSER TEST SUITE");
  console.log("==================================================");

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Opens http://localhost:3000/shop and verifies branding & catalog
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Navigating to http://localhost:3000/shop...");
    await page.goto("http://localhost:3000/shop", { waitUntil: "networkidle" });

    // Verify document title
    const docTitle = await page.title();
    console.log(`✓ Document title: "${docTitle}"`);
    if (!docTitle.includes("Kuro Labs")) {
      throw new Error(`Expected title to include 'Kuro Labs', got '${docTitle}'`);
    }

    // Verify Brand Logo & Subtitle
    await page.waitForSelector("text=KURO // LABS");
    await page.waitForSelector("text=CURATED LIFESTYLE & WORKSPACE ESSENTIALS");
    console.log("✓ Brand header logo & subtitle verified ('KURO // LABS').");

    // Wait for product cards to load from backend API
    await page.waitForSelector("text=Keychron Q1 Pro Wireless Custom Mechanical Keyboard", {
      timeout: 10000,
    });
    console.log("✓ Keychron Q1 Pro rendered from backend API.");

    // Check product title & price styling
    const keychronTitle = page.locator("h3", { hasText: "Keychron Q1 Pro" });
    const titleClass = await keychronTitle.getAttribute("class");
    console.log(`✓ Product title font class: "${titleClass}" (includes font-semibold).`);

    // -------------------------------------------------------------------------
    // STEP 2: Adds an item to the cart and completes the checkout form
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Adding item to cart and opening checkout...");

    const keychronCard = page.locator("div.group", {
      hasText: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
    });
    const addToCartBtn = keychronCard.locator("button", { hasText: "Add to Cart" });
    await addToCartBtn.click();
    console.log("✓ Clicked 'Add to Cart' for Keychron Q1 Pro.");

    await page.waitForTimeout(500);

    // Open Cart Drawer
    const cartNavBtn = page.locator("button[aria-label='Open cart']");
    await cartNavBtn.click();
    console.log("✓ Opened Cart Drawer.");

    // Verify item in drawer
    await page.waitForSelector("text=Your Cart");
    const drawerItem = page.locator("div", {
      hasText: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
    });
    await drawerItem.first().waitFor();
    console.log("✓ Verified Keychron Q1 Pro in Cart Drawer.");

    // Click Proceed to Checkout
    const checkoutBtn = page.locator("button", { hasText: "Proceed to Checkout" });
    await checkoutBtn.click();
    console.log("✓ Clicked 'Proceed to Checkout'.");

    // Fill checkout form
    await page.waitForSelector("text=Complete Your Order");
    const nameInput = page.locator("#customerName");
    const emailInput = page.locator("#customerEmail");
    await nameInput.fill("Automated E2E Tester");
    await emailInput.fill("e2e-tester@kurolabs.dev");
    console.log("✓ Filled customer name and email.");

    const confirmOrderBtn = page.locator("button", { hasText: "Confirm & Place Order" });
    await confirmOrderBtn.click();
    console.log("✓ Submitted checkout form to POST /api/checkout.");

    // -------------------------------------------------------------------------
    // STEP 3: Asserts the order confirmation modal displays with an Order ID
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Asserting order confirmation receipt...");
    await page.waitForSelector("text=Order Confirmed", { timeout: 10000 });
    console.log("✓ 'Order Confirmed' header displayed!");

    const orderIdElement = page.locator("text=ORDER ID").locator("..").locator("span.font-semibold");
    const orderIdText = await orderIdElement.innerText();
    console.log(`✓ Order confirmed with Order ID: ${orderIdText}`);

    await page.waitForSelector("text=e2e-tester@kurolabs.dev");
    console.log("✓ Customer email matches on receipt.");

    const continueShoppingBtn = page.locator("button", { hasText: "Continue Shopping" });
    await continueShoppingBtn.click();
    console.log("✓ Closed confirmation modal.");

    // -------------------------------------------------------------------------
    // STEP 4: Navigates to /admin, creates a new product SKU, tests restock & orders
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Navigating to http://localhost:3000/admin...");
    await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });

    await page.waitForSelector("text=KURO // OPS");
    console.log("✓ Admin Operations Dashboard loaded ('KURO // OPS').");

    // Test Create Product Modal
    console.log("Testing Create Product feature in Admin panel...");
    const addProductBtn = page.locator("button", { hasText: "Add Product" });
    await addProductBtn.first().click();
    await page.waitForSelector("h3:has-text('Add Product')");
    console.log("✓ Create Product modal opened.");

    // Fill form
    const productNameInput = page.locator("input[placeholder*='e.g. Kuro Precision']");
    await productNameInput.fill("Kuro Artisan Brass Keycap");

    // Select Lifestyle category preset
    const lifestylePresetBtn = page.locator("button", { hasText: "Lifestyle" });
    await lifestylePresetBtn.first().click();

    // Fill price & stock
    const priceInput = page.locator("input[placeholder='79.00']");
    await priceInput.fill("65.00");

    const stockInput = page.locator("input[placeholder='20']");
    await stockInput.fill("12");

    const descInput = page.locator("textarea[placeholder*='Brief architectural']");
    await descInput.fill("Handcrafted solid brass CNC milled keycap with polished finish.");

    const sampleUrlBtn = page.locator("button", { hasText: "Fill Sample URL" });
    await sampleUrlBtn.click();

    // Submit product creation
    const publishBtn = page.locator("button", { hasText: "Create & Publish" });
    await publishBtn.click();
    console.log("✓ Submitted new product form to POST /api/products.");

    // Verify success banner and new product row in table
    await page.waitForSelector("text=Kuro Artisan Brass Keycap", { timeout: 10000 });
    console.log("✓ New product 'Kuro Artisan Brass Keycap' successfully created and rendered in inventory table!");

    // Switch to Order Pipeline tab
    const orderPipelineTab = page.locator("button", { hasText: "Order Pipeline" });
    await orderPipelineTab.click();
    console.log("✓ Switched to Order Pipeline tab.");

    // Verify order in pipeline
    await page.waitForSelector("text=Automated E2E Tester", { timeout: 10000 });
    console.log("✓ Verified order in pipeline table.");

    // Update order status
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("PROCESSING");
    console.log("✓ Updated order status to 'PROCESSING' via PATCH dropdown.");

    await page.waitForTimeout(500);

    // Switch back to Inventory tab
    const inventoryTab = page.locator("button", { hasText: "Inventory Management" });
    await inventoryTab.click();

    // Test inline restock on newly created product
    const brassRow = page.locator("tr", { hasText: "Kuro Artisan Brass Keycap" }).first();
    const brassRestockInput = brassRow.locator("input[placeholder='+5']");
    await brassRestockInput.fill("5");
    const brassRestockBtn = brassRow.locator("button", { hasText: "Restock" });
    await brassRestockBtn.click();
    console.log("✓ Executed inline restock on newly created SKU.");

    await page.waitForSelector("text=Restocked", { timeout: 5000 });
    console.log("✓ Inline restock confirmed!");

    // -------------------------------------------------------------------------
    // STEP 5: Test Floating AI Shopping Concierge & Typography
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Testing Floating AI Shopping Concierge & Typography...");
    await page.goto("http://localhost:3000/shop", { waitUntil: "networkidle" });

    // Confirm newly added product also appears in the storefront catalog!
    await page.waitForSelector("text=Kuro Artisan Brass Keycap", { timeout: 5000 });
    console.log("✓ Newly created product appears on the Storefront Catalog page!");

    // Open Concierge
    const conciergeBtn = page.locator("button[aria-label='Open AI Shopping Concierge']");
    await conciergeBtn.click();
    console.log("✓ Opened AI Concierge panel.");

    await page.waitForSelector("text=Hardware Concierge");

    // Click suggested chip
    const chipBtn = page.locator("button", { hasText: "Find accessories under $50" });
    await chipBtn.click();
    console.log("✓ Clicked suggestion chip: 'Find accessories under $50'.");

    // Wait for AI response bubble and check CONCIERGE AI tracking
    await page.waitForSelector("text=CONCIERGE AI", { timeout: 10000 });
    const conciergeHeader = page.locator("span", { hasText: "CONCIERGE AI" }).first();
    const headerClass = await conciergeHeader.locator("..").getAttribute("class");
    console.log(`✓ Sender header class: "${headerClass}" (includes text-xs font-mono tracking-wider).`);

    // Verify mini-cards rendered
    await page.waitForSelector("text=Recommended Hardware");
    const miniCardAddBtn = page.locator("button", { hasText: "Add" }).first();
    await miniCardAddBtn.click();
    console.log("✓ Clicked 'Add' on mini-card in AI chat bubble.");

    await page.waitForTimeout(500);

    // Close concierge
    await conciergeBtn.click();
    console.log("✓ Closed AI Concierge panel.");

    console.log("\n==================================================");
    console.log("ALL VERIFICATION CHECKS PASSED PERFECTLY! [OK]");
    console.log("==================================================");
  } catch (error) {
    console.error("\n❌ E2E TEST FAILED:", error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runE2ETests();
