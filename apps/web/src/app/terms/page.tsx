import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — goBlink',
  description: 'Terms of Service for using goBlink cross-chain token transfer platform.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-h1 mb-4" style={{ color: 'var(--text-primary)' }}>
          Terms of Service
        </h1>
        <p className="text-body-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          Last Updated: February 20, 2026
        </p>
        <div className="p-4 rounded-lg mt-4" style={{ background: 'var(--warning-bg)', border: '1px solid var(--border)' }}>
          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>Important Legal Notice:</strong> This document is provided for informational purposes only and does not constitute legal advice. Users should consult their own legal counsel before using the Service.
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="mb-12 p-6 rounded-lg" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        <h2 className="text-h4 mb-4" style={{ color: 'var(--text-primary)' }}>
          Table of Contents
        </h2>
        <ol className="space-y-2 list-decimal list-inside text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          <li><a href="#acceptance" className="hover:opacity-70 transition-opacity">Acceptance of Terms</a></li>
          <li><a href="#service" className="hover:opacity-70 transition-opacity">Description of Service</a></li>
          <li><a href="#eligibility" className="hover:opacity-70 transition-opacity">Eligibility</a></li>
          <li><a href="#wallet" className="hover:opacity-70 transition-opacity">Wallet Connection & Authentication</a></li>
          <li><a href="#transactions" className="hover:opacity-70 transition-opacity">Transactions</a></li>
          <li><a href="#fees" className="hover:opacity-70 transition-opacity">Fees</a></li>
          <li><a href="#prohibited" className="hover:opacity-70 transition-opacity">Prohibited Uses</a></li>
          <li><a href="#ip" className="hover:opacity-70 transition-opacity">Intellectual Property</a></li>
          <li><a href="#third-party" className="hover:opacity-70 transition-opacity">Third-Party Services</a></li>
          <li><a href="#disclaimers" className="hover:opacity-70 transition-opacity">Disclaimers</a></li>
          <li><a href="#liability" className="hover:opacity-70 transition-opacity">Limitation of Liability</a></li>
          <li><a href="#indemnification" className="hover:opacity-70 transition-opacity">Indemnification</a></li>
          <li><a href="#privacy" className="hover:opacity-70 transition-opacity">Privacy</a></li>
          <li><a href="#modifications" className="hover:opacity-70 transition-opacity">Modifications</a></li>
          <li><a href="#governing-law" className="hover:opacity-70 transition-opacity">Governing Law</a></li>
          <li><a href="#disputes" className="hover:opacity-70 transition-opacity">Dispute Resolution</a></li>
          <li><a href="#severability" className="hover:opacity-70 transition-opacity">Severability</a></li>
          <li><a href="#contact" className="hover:opacity-70 transition-opacity">Contact</a></li>
        </ol>
      </nav>

      {/* Content */}
      <div className="prose prose-invert max-w-none space-y-10">
        
        {/* Section 1 */}
        <section id="acceptance">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            1. Acceptance of Terms
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              By accessing or using <strong>goBlink</strong> (the "Service"), which includes the website at <Link href="/" className="text-brand-500 hover:opacity-70">goblink.io</Link>, its subdomains, associated services, applications, and APIs, you ("User", "you", or "your") agree to be bound by these Terms of Service ("Terms").
            </p>
            <p>
              If you do not agree to these Terms, you must not access or use the Service. Your continued use of the Service constitutes acceptance of these Terms and any future modifications.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section id="service">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            2. Description of Service
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              goBlink is a <strong>non-custodial</strong> cross-chain token transfer facilitation platform. We provide a user interface that enables users to access and interact with the NEAR Intents (1Click) infrastructure for executing cross-chain cryptocurrency transfers.
            </p>
            <p>
              <strong>Important clarifications:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Non-Custodial:</strong> goBlink does not hold, store, or have access to user funds at any time. All transactions are executed on-chain via smart contracts and third-party infrastructure.</li>
              <li><strong>Facilitation Only:</strong> We provide the interface and tools to facilitate transfers, but we do not execute, guarantee, or control the underlying blockchain transactions or transfers.</li>
              <li><strong>Infrastructure Provider:</strong> The actual cross-chain transfer execution is performed by NEAR Intents and associated blockchain networks. goBlink is not responsible for the operation or reliability of these systems.</li>
              <li><strong>Auto-Refund:</strong> Failed transfers may trigger automatic refunds through the underlying infrastructure, though network fees may still apply and are non-refundable.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section id="eligibility">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            3. Eligibility
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              To use the Service, you must meet the following eligibility requirements:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You must be <strong>at least 18 years of age</strong> (or the age of majority in your jurisdiction).</li>
              <li>You must not be located in, under the control of, or a national or resident of any <strong>sanctioned jurisdiction</strong>, including but not limited to countries sanctioned by the U.S. Office of Foreign Assets Control (OFAC), the United Nations, the European Union, or other applicable sanctions authorities.</li>
              <li>You must not be listed on any sanctions lists (e.g., OFAC SDN list, EU sanctions lists).</li>
              <li>You are solely responsible for ensuring your use of the Service complies with all applicable laws, regulations, and rules in your jurisdiction, including but not limited to financial regulations, tax laws, anti-money laundering (AML) requirements, and know-your-customer (KYC) obligations.</li>
            </ul>
            <p>
              goBlink reserves the right to restrict or deny access to the Service from certain jurisdictions or to certain users at our discretion.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section id="wallet">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            4. Wallet Connection & Authentication
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              To use the Service, you may connect your cryptocurrency wallet(s) or authenticate using social login providers that create embedded wallets via our integration with Reown AppKit (formerly WalletConnect) and other providers.
            </p>
            <p>
              <strong>You are solely responsible for:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintaining the security and confidentiality of your wallet private keys, seed phrases, passwords, and authentication credentials.</li>
              <li>All transactions initiated from your connected wallet(s), whether authorized by you or by unauthorized third parties who gain access to your credentials.</li>
              <li>Understanding the risks of using embedded wallets created through social login providers.</li>
              <li>Ensuring you maintain backups of your seed phrases and private keys. Loss of access to your wallet is irreversible, and goBlink cannot recover lost funds or credentials.</li>
            </ul>
            <p>
              <strong>goBlink has no access to your private keys or seed phrases and cannot reverse, cancel, or recover transactions.</strong>
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section id="transactions">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            5. Transactions
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              When you initiate a cross-chain transfer through the Service, the following applies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Quotes Are Estimates:</strong> Token exchange rates, amounts, and fees displayed during the quote process are estimates and are not guaranteed. Prices may change between the time you receive a quote and the time the transaction is executed on-chain due to market volatility, slippage, network congestion, or other factors.</li>
              <li><strong>Irreversibility:</strong> Once a transaction is confirmed on the blockchain, it is <strong>irreversible</strong>. goBlink cannot cancel, reverse, or modify transactions once they are submitted.</li>
              <li><strong>Auto-Refund on Failure:</strong> If a transfer cannot be completed due to technical issues, smart contract errors, or other failures, the underlying infrastructure may automatically refund your tokens. However, network fees (gas fees) are non-refundable and may still be deducted.</li>
              <li><strong>No Guarantee of Execution:</strong> goBlink does not guarantee that any transaction will be successfully executed. Transactions may fail due to network congestion, smart contract errors, insufficient liquidity, slippage exceeding limits, or other technical issues.</li>
              <li><strong>Network Delays:</strong> Transaction processing times depend on blockchain network conditions and are beyond goBlink's control. Transfers may take longer than estimated during periods of high network activity.</li>
              <li><strong>User Error:</strong> You are responsible for ensuring that recipient addresses, token selections, amounts, and other transaction details are correct. Tokens sent to incorrect addresses or on incorrect chains may be permanently lost.</li>
            </ul>
            <p>
              <strong>goBlink is not responsible for:</strong> Failed transactions, network errors, blockchain forks, smart contract bugs, liquidity issues, slippage, user error, or any losses resulting from transaction execution or non-execution.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section id="fees">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            6. Fees
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              goBlink charges service fees for facilitating cross-chain transfers. Fees are calculated based on the following tiered structure:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Transfers under $1,000:</strong> 0.75% service fee</li>
              <li><strong>Transfers between $1,000 and $10,000:</strong> 0.50% service fee</li>
              <li><strong>Transfers over $10,000:</strong> 0.30% service fee</li>
            </ul>
            <p>
              <strong>Important fee information:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Service fees are displayed upfront as a dollar amount before you confirm a transaction.</li>
              <li><strong>Network fees (gas fees)</strong> are separate and paid directly to blockchain validators. These fees are set by the blockchain networks (e.g., Ethereum, Solana, NEAR) and are beyond goBlink's control.</li>
              <li>All fees are <strong>non-refundable</strong> once a transaction is submitted to the blockchain, regardless of whether the transaction succeeds or fails.</li>
              <li>goBlink reserves the right to adjust fee tiers at any time. Fee changes will be reflected in the Service, and your use of the Service after such changes constitutes acceptance of the new fees.</li>
            </ul>
          </div>
        </section>

        {/* Section 7 */}
        <section id="prohibited">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            7. Prohibited Uses
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              You agree not to use the Service for any unlawful or prohibited purposes, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Money Laundering:</strong> Using the Service to launder money or obscure the origin of funds.</li>
              <li><strong>Terrorist Financing:</strong> Funding or supporting terrorist organizations or activities.</li>
              <li><strong>Sanctions Evasion:</strong> Transferring funds to or from sanctioned individuals, entities, or jurisdictions.</li>
              <li><strong>Fraud or Misrepresentation:</strong> Engaging in fraudulent activities, scams, or misrepresenting your identity or intent.</li>
              <li><strong>Market Manipulation:</strong> Engaging in wash trading, spoofing, front-running, or other forms of market manipulation.</li>
              <li><strong>Illegal Activity:</strong> Using the Service for any activity that violates applicable laws or regulations in your jurisdiction.</li>
              <li><strong>Automated Abuse:</strong> Using bots, scrapers, or automated tools to access the Service without explicit written permission from goBlink.</li>
              <li><strong>System Interference:</strong> Attempting to interfere with, disrupt, or compromise the security or integrity of the Service or its underlying infrastructure.</li>
            </ul>
            <p>
              goBlink reserves the right to investigate suspected violations, restrict access, and cooperate with law enforcement authorities. We may terminate or suspend your access to the Service immediately without notice if we suspect prohibited use.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section id="ip">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            8. Intellectual Property
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              All content, branding, trademarks, logos, and materials provided through the Service, including but not limited to the "goBlink" name, logo, website design, user interface, and documentation, are the exclusive property of goBlink or its licensors.
            </p>
            <p>
              <strong>You may not:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Copy, reproduce, distribute, modify, or create derivative works from any content or materials provided by the Service without explicit written permission.</li>
              <li>Use the goBlink name, logo, or branding for commercial purposes without authorization.</li>
              <li>Remove or alter any copyright, trademark, or proprietary notices.</li>
            </ul>
            <p>
              Use of the Service does not grant you any ownership or license rights to goBlink's intellectual property beyond the limited right to access and use the Service in accordance with these Terms.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section id="third-party">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            9. Third-Party Services
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              The Service integrates with and relies on third-party services and infrastructure, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>NEAR Intents (1Click):</strong> Cross-chain transfer execution infrastructure</li>
              <li><strong>Reown AppKit (WalletConnect):</strong> Wallet connection and authentication</li>
              <li><strong>Blockchain Networks:</strong> Ethereum, Solana, NEAR, Sui, and other supported blockchains</li>
              <li><strong>Social Login Providers:</strong> Google, GitHub, and other OAuth providers</li>
            </ul>
            <p>
              <strong>goBlink is not responsible for:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The availability, reliability, security, or performance of third-party services.</li>
              <li>Outages, downtime, or service disruptions caused by third-party providers.</li>
              <li>Security breaches, vulnerabilities, or exploits in third-party services or blockchain networks.</li>
              <li>Changes to third-party APIs, protocols, or terms of service that affect the Service.</li>
            </ul>
            <p>
              Your use of third-party services is subject to their respective terms of service and privacy policies. goBlink makes no warranties or representations regarding third-party services.
            </p>
          </div>
        </section>

        {/* Section 10 */}
        <section id="disclaimers">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            10. Disclaimers
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p className="uppercase font-semibold">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
            <p>
              <strong>goBlink explicitly disclaims all warranties, including but not limited to:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Warranties of merchantability, fitness for a particular purpose, title, and non-infringement.</li>
              <li>Warranties that the Service will be uninterrupted, error-free, secure, or free from viruses or harmful components.</li>
              <li>Warranties regarding the accuracy, reliability, or completeness of information provided through the Service.</li>
            </ul>
            <p>
              <strong>Cryptocurrency Risk Acknowledgment:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Cryptocurrency transactions involve significant financial risk due to market volatility, regulatory uncertainty, and technical complexity.</li>
              <li>The value of cryptocurrencies can fluctuate dramatically and may result in substantial losses.</li>
              <li><strong>goBlink does not provide financial, investment, legal, or tax advice.</strong> You should consult qualified professionals before making financial decisions.</li>
              <li>goBlink is not responsible for losses resulting from market volatility, user error, smart contract bugs, blockchain network issues, or other technical failures.</li>
            </ul>
            <p>
              You assume all risks associated with using the Service and engaging in cryptocurrency transactions.
            </p>
          </div>
        </section>

        {/* Section 11 */}
        <section id="liability">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            11. Limitation of Liability
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p className="uppercase font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, GOBLINK AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Indirect, incidental, consequential, punitive, or exemplary damages,</strong> including but not limited to loss of profits, revenue, data, goodwill, or other intangible losses.</li>
              <li><strong>Losses from market volatility,</strong> including fluctuations in cryptocurrency prices or exchange rates.</li>
              <li><strong>Lost, stolen, or compromised funds</strong> resulting from user error, wallet compromise, phishing attacks, or unauthorized access.</li>
              <li><strong>Failed transactions,</strong> network congestion, smart contract bugs, or blockchain errors.</li>
              <li><strong>Service interruptions,</strong> downtime, data loss, or security breaches.</li>
            </ul>
            <p className="uppercase font-semibold mt-4">
              IN NO EVENT SHALL GOBLINK'S TOTAL LIABILITY TO YOU EXCEED THE TOTAL FEES PAID BY YOU TO GOBLINK IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.
            </p>
            <p>
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
            </p>
          </div>
        </section>

        {/* Section 12 */}
        <section id="indemnification">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            12. Indemnification
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              You agree to indemnify, defend, and hold harmless goBlink and its affiliates, officers, directors, employees, agents, and licensors from and against any and all claims, liabilities, damages, losses, costs, expenses (including reasonable attorneys' fees), arising out of or related to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your use or misuse of the Service.</li>
              <li>Your violation of these Terms or any applicable laws or regulations.</li>
              <li>Your violation of any third-party rights, including intellectual property rights or privacy rights.</li>
              <li>Any transactions you initiate through the Service.</li>
              <li>Unauthorized access to your wallet or credentials resulting from your negligence.</li>
            </ul>
            <p>
              goBlink reserves the right to assume the exclusive defense and control of any matter subject to indemnification by you, at your expense.
            </p>
          </div>
        </section>

        {/* Section 13 */}
        <section id="privacy">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            13. Privacy
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              goBlink is committed to protecting user privacy and operates on a minimal data collection model.
            </p>
            <p>
              <strong>Data We Collect:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Wallet Addresses:</strong> To facilitate transactions and display transaction history.</li>
              <li><strong>Transaction Hashes:</strong> To track transaction status and provide confirmation.</li>
              <li><strong>Usage Analytics:</strong> Anonymized analytics data to improve the Service (e.g., page views, feature usage).</li>
            </ul>
            <p>
              <strong>Data We Do NOT Collect:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Private keys or seed phrases.</li>
              <li>Personally identifiable information (PII) unless you provide it voluntarily (e.g., support inquiries).</li>
            </ul>
            <p>
              <strong>We do not sell, rent, or share your personal data with third parties for marketing purposes.</strong>
            </p>
            <p>
              For more information, please see our <Link href="/privacy" className="text-brand-500 hover:opacity-70">Privacy Policy</Link>.
            </p>
          </div>
        </section>

        {/* Section 14 */}
        <section id="modifications">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            14. Modifications
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              goBlink reserves the right to modify, update, or replace these Terms at any time at our sole discretion. Changes will be effective immediately upon posting to the Service.
            </p>
            <p>
              We will update the "Last Updated" date at the top of this page when changes are made. Your continued use of the Service after any changes constitutes acceptance of the updated Terms.
            </p>
            <p>
              We encourage you to review these Terms periodically. If you do not agree to the modified Terms, you must stop using the Service.
            </p>
          </div>
        </section>

        {/* Section 15 */}
        <section id="governing-law">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            15. Governing Law
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              These Terms and your use of the Service shall be governed by and construed in accordance with the laws of <strong>British Columbia, Canada</strong>, without regard to its conflict of law provisions.
            </p>
            <p>
              You agree that any legal action or proceeding arising out of or related to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts located in <strong>Vancouver, British Columbia, Canada</strong>.
            </p>
          </div>
        </section>

        {/* Section 16 */}
        <section id="disputes">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            16. Dispute Resolution
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              In the event of any dispute, claim, or controversy arising out of or relating to these Terms or the Service, you agree to the following resolution process:
            </p>
            <p>
              <strong>Step 1: Good Faith Negotiation</strong>
            </p>
            <p className="ml-4">
              You agree to first attempt to resolve the dispute through good faith negotiation by contacting goBlink at <a href="mailto:support@goblink.io" className="text-brand-500 hover:opacity-70">support@goblink.io</a>. Both parties will make reasonable efforts to resolve the dispute informally within thirty (30) days.
            </p>
            <p>
              <strong>Step 2: Binding Arbitration</strong>
            </p>
            <p className="ml-4">
              If the dispute cannot be resolved through negotiation, you agree that the dispute shall be resolved through <strong>binding arbitration</strong> administered by a mutually agreed arbitration service in <strong>Vancouver, British Columbia, Canada</strong>.
            </p>
            <p className="ml-4">
              The arbitration shall be conducted in English. The arbitrator's decision shall be final and binding, and judgment may be entered in any court of competent jurisdiction.
            </p>
            <p>
              <strong>Waiver of Class Actions:</strong> You agree to resolve disputes on an individual basis only and waive any right to participate in class actions, class arbitrations, or representative proceedings.
            </p>
          </div>
        </section>

        {/* Section 17 */}
        <section id="severability">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            17. Severability
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect.
            </p>
            <p>
              The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.
            </p>
          </div>
        </section>

        {/* Section 18 */}
        <section id="contact">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            18. Contact
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              If you have any questions, concerns, or feedback regarding these Terms or the Service, please contact us at:
            </p>
            <p className="ml-4">
              <strong>Email:</strong> <a href="mailto:support@goblink.io" className="text-brand-500 hover:opacity-70">support@goblink.io</a>
            </p>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="text-body-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          By using goBlink, you acknowledge that you have read, understood, and agreed to these Terms of Service.
        </p>
        <Link href="/" className="text-brand-500 hover:opacity-70 text-body-sm">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
