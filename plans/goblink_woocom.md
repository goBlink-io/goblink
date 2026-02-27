# goBlink for WooCommerce — Plugin Plan

**Status:** DRAFT — discuss before building  
**Date:** 2026-02-27  
**Plugin name:** `goblink-for-woocommerce`  
**WordPress.org slug:** `goblink-for-woocommerce`

---

## 1. What It Does

A WooCommerce payment gateway that lets customers pay with crypto on any chain. Merchant receives crypto to their wallet — non-custodial, no middleman, 0.05–0.35% fees.

**Customer experience:**
1. Customer adds items to cart, proceeds to checkout
2. Selects "Pay with Crypto (goBlink)" as payment method
3. Redirected to a goBlink hosted payment page (or inline iframe)
4. Picks their source chain/token, connects wallet, signs tx
5. Redirected back to merchant's "Order Received" page
6. Order marked as processing → paid once confirmed on-chain

**Merchant experience:**
1. Install plugin from WordPress.org
2. Enter receiving wallet address + preferred chain/token in settings
3. Done — crypto payments appear alongside other orders

---

## 2. Architecture

### Payment Flow

```
┌──────────┐       ┌────────────┐       ┌──────────────┐
│  WooComm │       │  goBlink   │       │   1Click     │
│ Checkout │──────▶│ Payment    │──────▶│  Protocol    │
│          │  (1)  │ Page       │  (3)  │              │
│          │       │            │◀──────│              │
│          │◀──────│            │  (4)  │              │
│          │  (5)  │            │       │              │
└──────────┘       └────────────┘       └──────────────┘

(1) Redirect to goblink.io/pay/{id} with order details
(2) Customer selects source chain, connects wallet, pays
(3) goBlink creates transfer via 1Click protocol  
(4) Transfer confirmed on-chain
(5) Redirect back to merchant + webhook/polling confirms payment
```

### Two Integration Modes

**Mode A: Redirect (recommended, simpler)**
- `process_payment()` creates a short payment link via SDK
- Returns redirect URL → customer goes to `goblink.io/pay/{id}`
- After payment, customer returns to WooCommerce `thankyou` page
- Plugin polls `getPaymentStatus()` via WP-Cron or AJAX to update order

**Mode B: Embedded iframe (advanced)**
- Checkout page embeds goBlink via iframe (`goblink.io/embed?...`)
- postMessage callbacks update the order status inline
- Smoother UX but more complex (CSP, iframe sizing, mobile issues)

**Recommendation:** Ship Mode A first. Add Mode B later as an option.

---

## 3. Plugin Structure

```
goblink-for-woocommerce/
├── goblink-for-woocommerce.php     # Plugin bootstrap (headers, activation)
├── readme.txt                       # WordPress.org readme (description, changelog, FAQ)
├── assets/
│   ├── icon-128x128.png            # Plugin icon (WordPress.org)
│   ├── banner-772x250.png          # Plugin banner
│   └── goblink-logo.svg            # Checkout display logo
├── includes/
│   ├── class-goblink-gateway.php   # WC_Payment_Gateway subclass (core)
│   ├── class-goblink-api.php       # API client (talks to goblink.io REST API)
│   ├── class-goblink-webhook.php   # Webhook receiver (optional future)
│   └── class-goblink-status.php    # WP-Cron status poller
├── templates/
│   ├── payment-form.php            # Checkout form (shows crypto info)
│   ├── thankyou.php                # Custom thank you message
│   └── admin-settings.php          # Admin settings page (optional override)
├── languages/
│   └── goblink-for-woocommerce.pot # i18n template
└── uninstall.php                    # Cleanup on uninstall
```

---

## 4. Core Class: `WC_Gateway_GoBlink`

```php
class WC_Gateway_GoBlink extends WC_Payment_Gateway {

    public $id = 'goblink';
    public $method_title = 'goBlink Crypto';
    public $method_description = 'Accept crypto payments on 26+ chains via goBlink.';
    public $has_fields = false;  // No fields on checkout page (redirect model)
    
    // Settings fields
    private $wallet_address;     // Merchant's receiving wallet
    private $wallet_chain;       // Preferred chain (e.g., 'ethereum', 'solana')
    private $wallet_token;       // Preferred token (e.g., 'USDC')
    private $order_status;       // Status after payment ('processing' or 'completed')
    private $debug_mode;         // Enable logging
    
    // Methods to implement:
    // __construct()          — set up form fields, hooks
    // init_form_fields()     — admin settings
    // process_payment($id)   — create payment link, return redirect
    // check_payment_status() — WP-Cron callback
    // payment_complete()     — mark order paid
}
```

---

## 5. Settings (Admin Panel)

| Field | Type | Description |
|-------|------|-------------|
| Enable/Disable | checkbox | Toggle the gateway on/off |
| Title | text | Display name at checkout (default: "Pay with Crypto") |
| Description | textarea | Checkout description (default: "Pay with any cryptocurrency on 26+ blockchains. Fast, low-cost, non-custodial.") |
| Wallet Address | text | **Required.** Merchant's receiving wallet address |
| Preferred Chain | select | Destination chain (dropdown of supported chains) |
| Preferred Token | select | Destination token (USDC, USDT, ETH, etc.) |
| Order Status | select | Status after confirmed payment: "Processing" or "Completed" |
| Fee Display | checkbox | Show estimated fee to customer at checkout |
| Debug Log | checkbox | Enable WooCommerce logging for troubleshooting |

### Optional/Future Settings
| Field | Description |
|-------|-------------|
| Custom Fee Recipient | Override the default goblink.near fee recipient (for partners) |
| Webhook URL | Auto-generated URL for push notifications (v2) |
| Iframe Mode | Toggle embedded mode vs redirect mode (v2) |

---

## 6. Payment Flow — Detailed

### Step 1: Customer clicks "Place Order"

`process_payment($order_id)` fires:

```php
function process_payment($order_id) {
    $order = wc_get_order($order_id);
    
    // Create payment link via goblink.io API
    $response = $this->api->shorten_payment_link([
        'recipient'  => $this->wallet_address,
        'chain'      => $this->wallet_chain,
        'token'      => $this->wallet_token,
        'amount'     => $this->convert_to_crypto($order->get_total()),
        'memo'       => 'Order #' . $order->get_order_number(),
        'name'       => get_bloginfo('name'),
    ]);
    
    // Store payment link ID on order
    $order->update_meta_data('_goblink_payment_id', $response['id']);
    $order->update_meta_data('_goblink_payment_url', $response['url']);
    $order->update_status('pending', 'Awaiting goBlink crypto payment.');
    $order->save();
    
    // Redirect to goBlink payment page
    return [
        'result'   => 'success',
        'redirect' => $response['url'],
    ];
}
```

### Step 2: Customer pays on goblink.io

The `/pay/{id}` page handles everything:
- Wallet connection
- Source chain/token selection
- Quote generation
- Transaction signing
- Deposit submission

After payment, customer is redirected to:
`{site_url}/checkout/order-received/{order_id}/?key={order_key}`

### Step 3: Order status updates

**Option A: Polling (v1 — simpler)**
- WP-Cron job runs every 2 minutes
- Queries all orders with status `pending` + `_goblink_payment_id` meta
- Calls `GET /api/pay/{id}/status` for each
- Updates order to `processing` or `completed` when `status === 'paid'`
- Marks `failed` if status is `failed` or `expired`

**Option B: Webhook (v2)**
- Plugin registers a REST endpoint: `POST /wp-json/goblink/v1/webhook`
- goblink.io calls it when payment status changes
- Verifies signature, updates order immediately

### Step 4: Order complete

```php
function payment_complete($order, $payment_status) {
    $order->payment_complete($payment_status['fulfillment_tx_hash']);
    $order->add_order_note(sprintf(
        'goBlink payment confirmed. TX: %s',
        $payment_status['fulfillment_tx_hash']
    ));
}
```

---

## 7. Price Conversion

### The Problem
WooCommerce orders are in fiat (e.g., $49.99 USD). goBlink transfers are in crypto (e.g., 49.99 USDC). For stablecoins this is 1:1. For non-stablecoins, we need conversion.

### The Solution
- **Stablecoins (USDC, USDT, DAI):** Amount = order total (1:1)
- **Non-stablecoins:** Use `getTokenPrices()` from SDK to convert at time of checkout
- **Slippage buffer:** Add configurable buffer (default 1%) for price movement between checkout and payment
- **Display:** Show exact crypto amount + USD equivalent at checkout

### Implementation
```php
function convert_to_crypto($fiat_amount) {
    $token = $this->wallet_token;
    
    // Stablecoins — direct 1:1
    if (in_array(strtoupper($token), ['USDC', 'USDT', 'DAI', 'BUSD'])) {
        return number_format($fiat_amount, 2, '.', '');
    }
    
    // Non-stablecoins — fetch price, convert
    $price = $this->api->get_token_price($token);
    if (!$price) {
        throw new Exception('Unable to fetch token price');
    }
    
    $crypto_amount = $fiat_amount / $price;
    $buffer = 1 + ($this->slippage_buffer / 100); // e.g., 1.01
    return number_format($crypto_amount * $buffer, 8, '.', '');
}
```

---

## 8. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Customer abandons payment page | Order stays `pending`. WP-Cron checks; expires after 7 days (configurable). |
| Payment underpaid | 1Click protocol handles — refund or partial fill. Order stays pending. |
| Payment overpaid | Excess handled by protocol. Order marked paid for original amount. |
| Price moves between checkout and payment | Slippage buffer absorbs small moves. Large moves: customer sees updated amount on goBlink page. |
| goblink.io API down | `process_payment()` catches error, shows WooCommerce error notice. Customer retries. |
| WP-Cron disabled | Admin notice warning. Suggest real cron or manual status check button. |
| Multiple currencies in store | Plugin uses WooCommerce store currency. If not USD, needs exchange rate (v2 feature). |
| Refunds | Manual for v1. Admin can initiate on goBlink side. v2: programmatic refund via API. |

---

## 9. WordPress.org Listing

### Plugin Headers
```php
/**
 * Plugin Name: goBlink for WooCommerce
 * Plugin URI: https://goblink.io/woocommerce
 * Description: Accept crypto payments on 26+ blockchains. Low fees, non-custodial, instant.
 * Version: 1.0.0
 * Author: goBlink
 * Author URI: https://goblink.io
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: goblink-for-woocommerce
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * WC requires at least: 8.0
 * WC tested up to: 9.6
 */
```

### readme.txt Highlights
- **Tested up to:** WordPress 6.8
- **Requires:** WooCommerce 8.0+
- **License:** GPL-2.0+ (WordPress.org requirement)
- **Tags:** crypto, payment, bitcoin, ethereum, woocommerce, cross-chain, defi

### FAQ Entries
1. "Do I need a goBlink account?" → No. Non-custodial. Funds go directly to your wallet.
2. "What wallets do customers need?" → Any wallet on supported chains (MetaMask, Phantom, etc.)
3. "What are the fees?" → 0.05–0.35% depending on transaction size. No monthly fees.
4. "Which cryptocurrencies are supported?" → 65+ tokens on 26+ chains including Ethereum, Solana, Bitcoin, Base, Arbitrum, and more.
5. "Is it safe?" → Non-custodial. Funds never touch goBlink servers. Auto-refund on failure.

---

## 10. Testing Plan

| Test | Method |
|------|--------|
| Plugin activates without errors | PHPUnit / manual |
| Settings save correctly | Manual |
| Payment link created on checkout | Mock API + integration test |
| Redirect works | Manual (staging store) |
| Order status updates on payment | Mock status response + WP-Cron trigger |
| Order marked failed on expiry | Time-based test |
| Debug logging works | Check WooCommerce logs |
| Uninstall cleans up | Verify options/meta removed |
| WooCommerce HPOS compatible | Test with HPOS enabled |
| PHP 7.4 / 8.0 / 8.2 / 8.3 compat | CI matrix |

---

## 11. Competitors & Differentiation

| Feature | goBlink | NOWPayments | CoinGate | BTCPay |
|---------|---------|-------------|----------|--------|
| Chains | 26+ | 20+ | 20+ | Bitcoin only* |
| Tokens | 65+ | 300+ | 50+ | BTC + Lightning |
| Fees | 0.05–0.35% | 0.4–0.5% | 1% | Free (self-hosted) |
| Custodial | No | No | Yes | No |
| Self-hosted | No | No | No | Yes (complex) |
| Setup time | 2 min | 5 min | 5 min | 30+ min |
| API key needed | No | Yes | Yes | Yes |
| Cross-chain | Yes | Limited | Limited | No |
| Auto-refund | Yes | No | Manual | N/A |

*BTCPay supports altcoins via Shapeshift but it's limited.

**Our pitch:** "Cheaper than NOWPayments. More chains than CoinGate. Easier than BTCPay. No API key, no account, no custody."

---

## 12. Open Questions

1. **Return URL handling** — Does `/pay/{id}` currently support a `redirect` query param to send the customer back to WooCommerce after payment? If not, we need to add it.

2. **Fiat conversion for non-USD stores** — WooCommerce stores can operate in EUR, GBP, etc. Do we need currency conversion, or do we require USD pricing?

3. **Order amount precision** — Stablecoins have 6 decimals (USDC). If an order is $49.99, do we send `49.99` or `49990000` (atomic)? The SDK handles conversion but the payment link API expects human-readable amounts.

4. **Multiple payment attempts** — If a customer abandons and retries, should we generate a new payment link or reuse the existing one? Payment links expire in 7 days.

5. **Tax handling** — WooCommerce calculates tax. The crypto amount should include tax. Confirm the total passed is `$order->get_total()` (includes tax + shipping).

6. **HPOS compatibility** — WooCommerce is migrating to High-Performance Order Storage (custom tables instead of post meta). Plugin must use `$order->update_meta_data()` not `update_post_meta()`.

7. **Block-based checkout** — WooCommerce is moving to block-based checkout (Gutenberg). Classic `WC_Payment_Gateway` still works but we should test compatibility.

---

## 13. Build Timeline

| Phase | What | Time |
|-------|------|------|
| Phase 1 | Core plugin (redirect mode, polling, settings) | 2–3 days |
| Phase 2 | Testing on staging WooCommerce store | 1 day |
| Phase 3 | WordPress.org submission + review | 1–2 weeks (review queue) |
| Phase 4 | Iframe mode, webhook support, refunds | Future |

---

## 14. Dependencies

- **goblink.io API:** `POST /api/pay/shorten`, `GET /api/pay/{id}/status`, `GET /api/tokens/prices`
- **SDK (optional):** Plugin calls goblink.io REST API directly via PHP (no npm dependency). The SDK is for JS/TS integrators.
- **WordPress:** 6.0+
- **WooCommerce:** 8.0+
- **PHP:** 7.4+
- **No external PHP dependencies** — uses `wp_remote_get/post` for HTTP. Zero Composer packages.
