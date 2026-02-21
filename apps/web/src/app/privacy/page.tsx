import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — goBlink',
  description: 'Privacy Policy for goBlink cross-chain token transfer platform.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-h1 mb-4" style={{ color: 'var(--text-primary)' }}>
          Privacy Policy
        </h1>
        <p className="text-body-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          Last Updated: February 21, 2026
        </p>
        <div className="p-4 rounded-lg mt-4" style={{ background: 'var(--info-bg)', border: '1px solid var(--border)' }}>
          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>Privacy-First Approach:</strong> goBlink is a non-custodial service. We collect minimal data necessary to provide the Service and never have access to your private keys or funds.
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="mb-12 p-6 rounded-lg" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        <h2 className="text-h4 mb-4" style={{ color: 'var(--text-primary)' }}>
          Table of Contents
        </h2>
        <ol className="space-y-2 list-decimal list-inside text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          <li><a href="#overview" className="hover:opacity-70 transition-opacity">Overview</a></li>
          <li><a href="#data-we-collect" className="hover:opacity-70 transition-opacity">Data We Collect</a></li>
          <li><a href="#legal-basis" className="hover:opacity-70 transition-opacity">Legal Basis for Processing</a></li>
          <li><a href="#how-we-use" className="hover:opacity-70 transition-opacity">How We Use Your Data</a></li>
          <li><a href="#data-sharing" className="hover:opacity-70 transition-opacity">Data Sharing and Third Parties</a></li>
          <li><a href="#cookies" className="hover:opacity-70 transition-opacity">Cookies and Tracking</a></li>
          <li><a href="#blockchain-data" className="hover:opacity-70 transition-opacity">Blockchain Data</a></li>
          <li><a href="#data-retention" className="hover:opacity-70 transition-opacity">Data Retention</a></li>
          <li><a href="#security" className="hover:opacity-70 transition-opacity">Security</a></li>
          <li><a href="#your-rights" className="hover:opacity-70 transition-opacity">Your Rights</a></li>
          <li><a href="#children" className="hover:opacity-70 transition-opacity">Children's Privacy</a></li>
          <li><a href="#changes" className="hover:opacity-70 transition-opacity">Changes to This Policy</a></li>
          <li><a href="#contact" className="hover:opacity-70 transition-opacity">Contact</a></li>
        </ol>
      </nav>

      {/* Content */}
      <div className="prose prose-invert max-w-none space-y-10">
        
        {/* Section 1 */}
        <section id="overview">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            1. Overview
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              This Privacy Policy describes how <strong>goBlink</strong> ("we", "us", or "our") collects, uses, and protects your information when you use our Service at <Link href="/" className="text-brand-500 hover:opacity-70">goblink.io</Link>.
            </p>
            <p>
              <strong>Core Privacy Principles:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Non-Custodial:</strong> We never have access to your private keys, seed phrases, or funds.</li>
              <li><strong>Minimal Data Collection:</strong> We only collect data necessary to provide and improve the Service.</li>
              <li><strong>No Data Sales:</strong> We do not sell, rent, or trade your personal information.</li>
              <li><strong>Transparency:</strong> We are transparent about what data we collect and how we use it.</li>
            </ul>
            <p>
              <strong>GDPR Compliance:</strong> For users in the European Union (EU) and the United Kingdom (UK), we process personal data in accordance with the EU General Data Protection Regulation (GDPR) and UK GDPR. This Privacy Policy explains your rights and how we comply with GDPR requirements.
            </p>
            <p>
              By using the Service, you consent to the collection and use of information as described in this Privacy Policy.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section id="data-we-collect">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            2. Data We Collect
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              We collect the following types of information:
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              2.1 Wallet and Transaction Data
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Wallet Addresses:</strong> Your public wallet addresses when you connect your wallet to the Service. This is necessary to display balances, transaction history, and facilitate transfers.</li>
              <li><strong>Transaction Hashes:</strong> Blockchain transaction hashes to track transfer status and provide confirmations.</li>
              <li><strong>Transaction Metadata:</strong> Token types, amounts, source and destination chains, and timestamps for transactions you initiate through the Service.</li>
            </ul>
            <p className="italic ml-4">
              <strong>Important:</strong> We never collect or have access to your private keys, seed phrases, or passwords. All transactions are signed in your wallet, not on our servers.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              2.2 Usage and Analytics Data
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>IP Address:</strong> Your IP address is collected for fraud prevention, security, and to determine your approximate geolocation (country/region level only). We do not track precise location.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, screen resolution, and device type.</li>
              <li><strong>Usage Metrics:</strong> Pages visited, features used, buttons clicked, and time spent on the Service.</li>
              <li><strong>Log Files:</strong> Server logs may temporarily contain IP addresses, browser information, timestamps, and requested URLs for debugging and security purposes.</li>
              <li><strong>MAC Address:</strong> In limited cases, device identifiers may be collected by analytics providers. We do not directly collect or store MAC addresses.</li>
              <li><strong>Referral Source:</strong> The website or source that referred you to goBlink.</li>
            </ul>
            <p className="ml-4">
              This data is collected through analytics services and is <strong>anonymized or pseudonymized</strong> wherever possible.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              2.3 Voluntarily Provided Information
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Support Inquiries:</strong> If you contact us for support, we may collect your email address, name (if provided), and the content of your inquiry.</li>
              <li><strong>Feedback:</strong> Feedback or suggestions you voluntarily submit about the Service.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              2.4 Blockchain Data Transparency Warning
            </h3>
            <p className="font-semibold" style={{ color: 'var(--warning)' }}>
              ⚠️ Important: Blockchain transactions are inherently public, transparent, and permanent.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All blockchain transactions you initiate through the Service are permanently recorded on public, distributed ledgers.</li>
              <li>Your wallet addresses, transaction amounts, timestamps, and transaction history are publicly visible on blockchain explorers (e.g., Etherscan, Solscan).</li>
              <li>This blockchain data is <strong>NOT controlled by goBlink</strong> and cannot be deleted, modified, or hidden. It is permanent and publicly accessible.</li>
              <li>Third parties may be able to correlate your wallet address with other information (such as IP addresses from other services, social media profiles, or exchange accounts) to potentially identify you.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              2.5 Data We Do NOT Collect
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>❌ Private keys or seed phrases</li>
              <li>❌ Wallet passwords or authentication credentials</li>
              <li>❌ Know-Your-Customer (KYC) information such as government IDs or photos</li>
              <li>❌ Financial account information (bank accounts, credit cards)</li>
              <li>❌ Precise geolocation data (GPS coordinates)</li>
            </ul>
          </div>
        </section>

        {/* Section 3 - NEW */}
        <section id="legal-basis">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            3. Legal Basis for Processing (GDPR)
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              For users in the EU and UK, we process personal data based on the following legal grounds under GDPR:
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              3.1 Contract Performance
            </h3>
            <p className="ml-4">
              Processing is necessary to provide the Service you have requested, including facilitating cross-chain transfers, displaying transaction history, and providing customer support.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              3.2 Legitimate Interest
            </h3>
            <p className="ml-4">
              We process data based on our legitimate interests in:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-8">
              <li><strong>Security and fraud prevention:</strong> Detecting and preventing fraudulent activity, abuse, and security threats.</li>
              <li><strong>Service improvement:</strong> Analyzing usage patterns to improve Service functionality, performance, and user experience.</li>
              <li><strong>Technical operations:</strong> Maintaining and optimizing our infrastructure, debugging errors, and ensuring system reliability.</li>
            </ul>
            <p className="ml-4">
              We have balanced these interests against your privacy rights and have implemented appropriate safeguards.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              3.3 Consent
            </h3>
            <p className="ml-4">
              We rely on your consent for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-8">
              <li>Non-essential cookies and analytics tracking (you can manage these preferences).</li>
              <li>Marketing communications (if you opt in, though we do not currently engage in marketing).</li>
            </ul>
            <p className="ml-4">
              You may withdraw consent at any time without affecting the lawfulness of processing based on consent before withdrawal.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              3.4 Legal Obligation
            </h3>
            <p className="ml-4">
              We may process data where necessary to comply with legal obligations, such as responding to lawful requests from authorities or complying with applicable regulations.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section id="how-we-use">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            4. How We Use Your Data
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              We use the collected data for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Provide the Service:</strong> To facilitate cross-chain transfers, display transaction history, track transfer status, and provide account features.</li>
              <li><strong>Improve the Service:</strong> To analyze usage patterns, identify bugs, optimize performance, and develop new features.</li>
              <li><strong>Security and Fraud Prevention:</strong> To detect and prevent fraudulent activity, abuse, and security threats.</li>
              <li><strong>Customer Support:</strong> To respond to your inquiries, resolve issues, and provide assistance.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, legal processes, or enforceable governmental requests.</li>
              <li><strong>Analytics:</strong> To measure and understand how users interact with the Service using anonymized data.</li>
            </ul>
            <p>
              We do <strong>not</strong> use your data for targeted advertising or marketing purposes.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section id="data-sharing">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            5. Data Sharing and Third Parties
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              goBlink does <strong>not sell, rent, or trade</strong> your personal information to third parties.
            </p>
            <p>
              However, we may share limited data with trusted third-party service providers for the following purposes:
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              5.1 Service Providers
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Cross-Chain Infrastructure:</strong> Third-party intent execution services and Solver networks. We share transaction parameters (tokens, amounts, addresses) necessary to execute transfers.</li>
              <li><strong>Reown AppKit (WalletConnect):</strong> Wallet connection and authentication service. Your wallet address is shared to enable wallet connectivity.</li>
              <li><strong>Blockchain Networks:</strong> Transaction data is broadcast to public blockchain networks (Ethereum, Solana, NEAR, etc.) as part of the on-chain execution process.</li>
              <li><strong>Analytics Providers:</strong> We may use services like Vercel Analytics, Google Analytics, or similar tools to analyze anonymized usage data.</li>
              <li><strong>Hosting Providers:</strong> Our website is hosted on Vercel and may use cloud infrastructure providers (e.g., AWS, Google Cloud) to store anonymized data.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              5.2 Third-Country Transfers
            </h3>
            <p>
              Your data may be processed and stored in countries outside the European Economic Area (EEA) and the United Kingdom, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>United States:</strong> Our hosting and analytics providers may process data in the U.S.</li>
              <li><strong>Canada:</strong> goBlink is based in Canada and may process data locally.</li>
              <li><strong>Other countries:</strong> Third-party service providers may operate in various jurisdictions.</li>
            </ul>
            <p>
              Where data is transferred to countries that do not provide an adequate level of data protection as determined by the European Commission:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We rely on <strong>Standard Contractual Clauses (SCCs)</strong> approved by the European Commission to ensure appropriate safeguards.</li>
              <li>We may rely on <strong>adequacy decisions</strong> where the destination country has been deemed to provide adequate protection (e.g., Canada for commercial organizations under PIPEDA).</li>
              <li>We implement additional technical and organizational measures to protect your data during cross-border transfers.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              5.3 Advertising and Analytics Pixels
            </h3>
            <p>
              We may use analytics tools and services that employ tracking pixels or similar technologies. These may include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Vercel Analytics:</strong> First-party analytics for traffic and performance monitoring.</li>
              <li><strong>Google Analytics:</strong> (If used) Anonymized analytics for usage patterns. You can opt out using browser settings or Google's opt-out tools.</li>
            </ul>
            <p>
              We do not use advertising pixels for targeted advertising or retargeting. Analytics tools are used solely for Service improvement and anonymized metrics.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              5.4 Legal Requirements
            </h3>
            <p>
              We may disclose information if required to do so by law or in response to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Valid legal processes (subpoenas, court orders)</li>
              <li>Requests from law enforcement or government agencies</li>
              <li>Protection of our legal rights or compliance with applicable laws</li>
              <li>Prevention of fraud, security threats, or illegal activity</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              5.5 Public Blockchain Data
            </h3>
            <p>
              <strong>Important:</strong> All blockchain transactions are public and permanently recorded on distributed ledgers. Your wallet addresses and transaction history are publicly visible on blockchain explorers. This data is <strong>not</strong> controlled by goBlink and cannot be deleted or modified. See Section 7 (Blockchain Data) for more details.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section id="cookies">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            6. Cookies and Tracking Technologies
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              We use cookies and similar tracking technologies to enhance your experience and collect usage data.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              Types of Cookies We Use:
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Essential Cookies:</strong> Required for the Service to function properly (e.g., wallet connection state, theme preferences). These cannot be disabled without affecting Service functionality.</li>
              <li><strong>Analytics Cookies:</strong> Used to measure website traffic and user behavior through tools like Vercel Analytics or Google Analytics. These are anonymized and help us improve the Service. You can opt out through browser settings.</li>
              <li><strong>Local Storage:</strong> Browser local storage is used to save user preferences (e.g., dark mode, recent transfers) locally on your device.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              Third-Party Services:
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Social Media Plugins:</strong> We do not currently use social media plugins (e.g., Facebook Like buttons, Twitter embeds) that would allow third parties to track you across websites. If we add such features in the future, we will update this policy and provide opt-out mechanisms.</li>
              <li><strong>Analytics Tools:</strong> We may use Vercel Analytics (first-party) and/or Google Analytics (third-party) for anonymized usage metrics. These tools may set cookies to track sessions and user behavior.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              Managing Cookies:
            </h3>
            <p>
              You can control cookies through your browser settings. Note that disabling essential cookies may affect the functionality of the Service.
            </p>
            <p>
              Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies (may affect Service functionality)</li>
              <li>Clear cookies when you close your browser</li>
            </ul>
            <p>
              For third-party analytics cookies (e.g., Google Analytics), you can opt out using:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Browser privacy settings (e.g., "Do Not Track" signals)</li>
              <li>Google Analytics Opt-out Browser Add-on: <a href="https://tools.google.com/dlpage/gaoptout" className="text-brand-500 hover:opacity-70" target="_blank" rel="noopener noreferrer">tools.google.com/dlpage/gaoptout</a></li>
            </ul>
          </div>
        </section>

        {/* Section 7 - NEW */}
        <section id="blockchain-data">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            7. Blockchain Data
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p className="font-semibold" style={{ color: 'var(--warning)' }}>
              ⚠️ Blockchain Transactions Are Public, Permanent, and Beyond Our Control
            </p>
            <p>
              When you use the Service to execute blockchain transactions, it is critical to understand the following:
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              7.1 Inherent Transparency
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>All blockchain transactions are public.</strong> Blockchain networks (Ethereum, Solana, NEAR, etc.) are distributed, public ledgers. Every transaction is permanently recorded and visible to anyone.</li>
              <li><strong>Wallet addresses and transaction history are publicly visible</strong> on blockchain explorers (e.g., Etherscan, Solscan, NEAR Explorer).</li>
              <li>Anyone can view your wallet balance, transaction amounts, token types, timestamps, and counterparties without restriction.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              7.2 Permanence and Immutability
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Blockchain data is permanent and cannot be deleted.</strong> Once a transaction is confirmed on-chain, it becomes part of the permanent historical record.</li>
              <li>goBlink has <strong>no control</strong> over blockchain data. We cannot delete, modify, hide, or redact transactions, wallet addresses, or transaction history.</li>
              <li>GDPR's "right to erasure" (right to be forgotten) does <strong>not apply</strong> to blockchain data because it is stored on decentralized, public networks beyond any single entity's control.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              7.3 Correlation Risk and De-Anonymization
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Wallet addresses may be linked to your identity.</strong> While wallet addresses are pseudonymous (not directly tied to your name), third parties may correlate your wallet address with other information to identify you, including:
                <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                  <li>IP addresses or metadata from other services (e.g., centralized exchanges, wallet providers)</li>
                  <li>Social media profiles where you've shared your wallet address</li>
                  <li>On-chain analysis tools that track transaction patterns and link wallets</li>
                  <li>KYC information from exchanges or other services</li>
                </ul>
              </li>
              <li>Once your wallet address is linked to your identity, <strong>all past and future transactions</strong> associated with that address become publicly attributable to you.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              7.4 What You Can Do
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use separate wallets for different purposes to limit correlation.</li>
              <li>Avoid publicly sharing your wallet addresses on social media or forums.</li>
              <li>Be aware that blockchain data is permanent and public before initiating transactions.</li>
              <li>Understand that privacy on public blockchains is limited and transactions are traceable.</li>
            </ul>

            <p className="mt-4 font-semibold">
              By using goBlink to execute blockchain transactions, you acknowledge and accept that blockchain data is public, permanent, and beyond our control.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section id="data-retention">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            8. Data Retention
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              We retain your data only as long as necessary to provide the Service and comply with legal obligations.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Transaction Data:</strong> Retained for as long as you use the Service to provide transaction history and support. You can request deletion of transaction history stored by goBlink at any time (note: blockchain data remains public and permanent).</li>
              <li><strong>Analytics Data:</strong> Anonymized analytics data may be retained indefinitely for statistical and research purposes.</li>
              <li><strong>Support Inquiries:</strong> Retained for a reasonable period (typically 1-2 years) to resolve your inquiry and prevent abuse.</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law or to resolve disputes.</li>
            </ul>
            <p>
              <strong>Note:</strong> Blockchain transaction data is permanent and cannot be deleted by goBlink as it is stored on public, decentralized networks beyond our control.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section id="security">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            9. Security
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              We take reasonable measures to protect your information from unauthorized access, disclosure, alteration, or destruction.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              Security Measures:
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>HTTPS Encryption:</strong> All data transmitted between your browser and our servers is encrypted using TLS/SSL.</li>
              <li><strong>Non-Custodial Architecture:</strong> We never store private keys or have access to your funds, eliminating the risk of custodial breaches.</li>
              <li><strong>Secure Hosting:</strong> Our infrastructure is hosted on secure cloud platforms (Vercel, AWS, etc.) with industry-standard security practices.</li>
              <li><strong>Access Controls:</strong> Internal access to data is restricted and monitored.</li>
              <li><strong>Regular Audits:</strong> We periodically review our security practices and infrastructure.</li>
            </ul>

            <p className="mt-4">
              <strong>However:</strong> No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              Your Responsibility:
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Protect your wallet private keys and seed phrases.</li>
              <li>Use strong passwords and enable two-factor authentication (2FA) where available.</li>
              <li>Beware of phishing attempts. goBlink will never ask for your private keys or seed phrases.</li>
              <li>Verify you are on the correct domain (goblink.io) before connecting your wallet.</li>
            </ul>
          </div>
        </section>

        {/* Section 10 */}
        <section id="your-rights">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            10. Your Rights
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              Depending on your jurisdiction, you may have certain rights regarding your personal data.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              10.1 GDPR Rights (EU and UK Users)
            </h3>
            <p>
              If you are located in the EU or UK, you have the following rights under GDPR:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your personal data. <em>Note: This does not apply to blockchain data, which is permanent and beyond our control.</em></li>
              <li><strong>Right to Restrict Processing:</strong> Request that we limit how we process your data in certain circumstances.</li>
              <li><strong>Right to Data Portability:</strong> Request a copy of your data in a machine-readable format to transfer to another service.</li>
              <li><strong>Right to Object:</strong> Object to certain types of data processing, such as processing based on legitimate interests or for direct marketing purposes.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing where consent is the legal basis (e.g., analytics cookies). This does not affect the lawfulness of processing before withdrawal.</li>
              <li><strong>Right Not to Be Subject to Automated Decision-Making:</strong> Request human review of decisions made solely by automated processing that significantly affect you. <em>Note: goBlink does not engage in automated decision-making that produces legal or similarly significant effects.</em></li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              10.2 Filing a Complaint with a Supervisory Authority
            </h3>
            <p>
              If you are located in the EU or UK, you have the right to file a complaint with a data protection supervisory authority if you believe we have violated your privacy rights:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>EU Users:</strong> Contact your national data protection authority. A list is available at <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" className="text-brand-500 hover:opacity-70" target="_blank" rel="noopener noreferrer">edpb.europa.eu</a>.</li>
              <li><strong>UK Users:</strong> Contact the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" className="text-brand-500 hover:opacity-70" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              10.3 Other Jurisdictions
            </h3>
            <p>
              Users in other jurisdictions may have similar rights under local privacy laws (e.g., CCPA in California, PIPEDA in Canada). Contact us to exercise your rights.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              10.4 How to Exercise Your Rights
            </h3>
            <p>
              To exercise any of the above rights, please contact us at <a href="mailto:support@goblink.io" className="text-brand-500 hover:opacity-70">support@goblink.io</a>.
            </p>
            <p>
              We will respond to your request within <strong>30 days</strong> (as required by GDPR). We may ask you to verify your identity before processing your request to ensure the security of your data.
            </p>
          </div>
        </section>

        {/* Section 11 */}
        <section id="children">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            11. Children's Privacy
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
            </p>
            <p>
              If you believe we have inadvertently collected information from a child under 18, please contact us immediately at <a href="mailto:support@goblink.io" className="text-brand-500 hover:opacity-70">support@goblink.io</a>, and we will take steps to delete such information.
            </p>
          </div>
        </section>

        {/* Section 12 */}
        <section id="changes">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            12. Changes to This Policy
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or Service features.
            </p>
            <p>
              When we make changes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We will update the "Last Updated" date at the top of this page.</li>
              <li>Significant changes will be communicated through the Service or via email (if you have provided one).</li>
              <li>Your continued use of the Service after changes are posted constitutes acceptance of the updated Privacy Policy.</li>
            </ul>
            <p>
              We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
            </p>
          </div>
        </section>

        {/* Section 13 */}
        <section id="contact">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            13. Contact
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us:
            </p>
            <p className="ml-4">
              <strong>Email:</strong> <a href="mailto:support@goblink.io" className="text-brand-500 hover:opacity-70">support@goblink.io</a>
            </p>
            <p>
              We will respond to your inquiry as soon as reasonably possible, typically within 30 days.
            </p>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="text-body-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          By using goBlink, you acknowledge that you have read and understood this Privacy Policy.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/terms" className="text-brand-500 hover:opacity-70 text-body-sm">
            Terms of Service
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <Link href="/" className="text-brand-500 hover:opacity-70 text-body-sm">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
