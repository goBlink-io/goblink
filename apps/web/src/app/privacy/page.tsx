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
          Last Updated: February 20, 2026
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
          <li><a href="#how-we-use" className="hover:opacity-70 transition-opacity">How We Use Your Data</a></li>
          <li><a href="#data-sharing" className="hover:opacity-70 transition-opacity">Data Sharing and Third Parties</a></li>
          <li><a href="#cookies" className="hover:opacity-70 transition-opacity">Cookies and Tracking</a></li>
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
              <li><strong>Device Information:</strong> Browser type, operating system, screen resolution, and device type.</li>
              <li><strong>Usage Metrics:</strong> Pages visited, features used, buttons clicked, and time spent on the Service.</li>
              <li><strong>IP Address:</strong> Your IP address for fraud prevention, security, and approximate geolocation (country/region level only).</li>
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
              2.4 Data We Do NOT Collect
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

        {/* Section 3 */}
        <section id="how-we-use">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            3. How We Use Your Data
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

        {/* Section 4 */}
        <section id="data-sharing">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            4. Data Sharing and Third Parties
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              goBlink does <strong>not sell, rent, or trade</strong> your personal information to third parties.
            </p>
            <p>
              However, we may share limited data with trusted third-party service providers for the following purposes:
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              4.1 Service Providers
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Cross-Chain Infrastructure:</strong> Third-party transfer execution services. We share transaction parameters (tokens, amounts, addresses) necessary to execute transfers.</li>
              <li><strong>Reown AppKit (WalletConnect):</strong> Wallet connection and authentication service. Your wallet address is shared to enable wallet connectivity.</li>
              <li><strong>Blockchain Networks:</strong> Transaction data is broadcast to public blockchain networks (Ethereum, Solana, NEAR, etc.) as part of the on-chain execution process.</li>
              <li><strong>Analytics Providers:</strong> We may use services like Vercel Analytics or similar tools to analyze anonymized usage data.</li>
              <li><strong>Hosting Providers:</strong> Our website is hosted on Vercel and may use cloud infrastructure providers to store anonymized data.</li>
            </ul>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              4.2 Legal Requirements
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
              4.3 Public Blockchain Data
            </h3>
            <p>
              <strong>Important:</strong> All blockchain transactions are public and permanently recorded on distributed ledgers. Your wallet addresses and transaction history are publicly visible on blockchain explorers. This data is <strong>not</strong> controlled by goBlink and cannot be deleted or modified.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section id="cookies">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            5. Cookies and Tracking Technologies
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              We use cookies and similar tracking technologies to enhance your experience and collect usage data.
            </p>

            <h3 className="text-h5 mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
              Types of Cookies We Use:
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Essential Cookies:</strong> Required for the Service to function properly (e.g., wallet connection state, theme preferences). These cannot be disabled.</li>
              <li><strong>Analytics Cookies:</strong> Used to measure website traffic and user behavior. These are anonymized and help us improve the Service.</li>
              <li><strong>Local Storage:</strong> Browser local storage is used to save user preferences (e.g., dark mode, recent transfers) locally on your device.</li>
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
          </div>
        </section>

        {/* Section 6 */}
        <section id="data-retention">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            6. Data Retention
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              We retain your data only as long as necessary to provide the Service and comply with legal obligations.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Transaction Data:</strong> Retained for as long as you use the Service to provide transaction history and support. You can request deletion of transaction history at any time.</li>
              <li><strong>Analytics Data:</strong> Anonymized analytics data may be retained indefinitely for statistical and research purposes.</li>
              <li><strong>Support Inquiries:</strong> Retained for a reasonable period to resolve your inquiry and prevent abuse.</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law or to resolve disputes.</li>
            </ul>
            <p>
              <strong>Note:</strong> Blockchain transaction data is permanent and cannot be deleted by goBlink as it is stored on public, decentralized networks.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section id="security">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            7. Security
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
              <li><strong>Secure Hosting:</strong> Our infrastructure is hosted on secure cloud platforms with industry-standard security practices.</li>
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

        {/* Section 8 */}
        <section id="your-rights">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            8. Your Rights
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              Depending on your jurisdiction, you may have certain rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
              <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format.</li>
              <li><strong>Objection:</strong> Object to certain types of data processing (e.g., marketing, though we do not engage in targeted marketing).</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where consent is the legal basis.</li>
            </ul>

            <p className="mt-4">
              To exercise your rights, please contact us at <a href="mailto:support@goblink.io" className="text-brand-500 hover:opacity-70">support@goblink.io</a>.
            </p>

            <p>
              <strong>Note:</strong> We may ask you to verify your identity before processing your request.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section id="children">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            9. Children's Privacy
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

        {/* Section 10 */}
        <section id="changes">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            10. Changes to This Policy
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

        {/* Section 11 */}
        <section id="contact">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            11. Contact
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us:
            </p>
            <p className="ml-4">
              <strong>Email:</strong> <a href="mailto:support@goblink.io" className="text-brand-500 hover:opacity-70">support@goblink.io</a>
            </p>
            <p>
              We will respond to your inquiry as soon as reasonably possible.
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
