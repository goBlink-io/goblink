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
          Last Updated: February 21, 2026
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="mb-12 p-6 rounded-lg" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        <h2 className="text-h4 mb-4" style={{ color: 'var(--text-primary)' }}>
          Table of Contents
        </h2>
        <ol className="space-y-2 list-decimal list-inside text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          <li><a href="#acceptance" className="hover:opacity-70 transition-opacity">Acceptance of Terms</a></li>
          <li><a href="#definitions" className="hover:opacity-70 transition-opacity">Definitions</a></li>
          <li><a href="#service" className="hover:opacity-70 transition-opacity">Description of Service</a></li>
          <li><a href="#eligibility" className="hover:opacity-70 transition-opacity">Eligibility</a></li>
          <li><a href="#wallet" className="hover:opacity-70 transition-opacity">Wallet Connection & Authentication</a></li>
          <li><a href="#transactions" className="hover:opacity-70 transition-opacity">Transactions</a></li>
          <li><a href="#no-fiduciary" className="hover:opacity-70 transition-opacity">No Fiduciary Duty</a></li>
          <li><a href="#fees" className="hover:opacity-70 transition-opacity">Fees</a></li>
          <li><a href="#prohibited" className="hover:opacity-70 transition-opacity">Prohibited Uses</a></li>
          <li><a href="#ip" className="hover:opacity-70 transition-opacity">Intellectual Property</a></li>
          <li><a href="#third-party" className="hover:opacity-70 transition-opacity">Third-Party Services</a></li>
          <li><a href="#disclaimers" className="hover:opacity-70 transition-opacity">Disclaimers</a></li>
          <li><a href="#liability" className="hover:opacity-70 transition-opacity">Limitation of Liability</a></li>
          <li><a href="#release" className="hover:opacity-70 transition-opacity">Release of Claims</a></li>
          <li><a href="#indemnification" className="hover:opacity-70 transition-opacity">Indemnification</a></li>
          <li><a href="#compliance" className="hover:opacity-70 transition-opacity">Compliance and Tax</a></li>
          <li><a href="#not-registered" className="hover:opacity-70 transition-opacity">Not Registered with Regulatory Authorities</a></li>
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

        {/* Section 2 - NEW */}
        <section id="definitions">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            2. Definitions
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              The following terms have specific meanings in these Terms:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Protocol:</strong> The underlying cross-chain infrastructure and smart contracts that enable intent-based token transfers across blockchains.</li>
              <li><strong>Intent:</strong> A user&apos;s expression of a desired outcome (e.g., &quot;transfer 100 USDC from Ethereum to Solana&quot;) without specifying the exact execution path.</li>
              <li><strong>Solver:</strong> A third-party service provider that competes to fulfill user intents by finding optimal execution paths and providing quotes.</li>
              <li><strong>Execution Network:</strong> The decentralized network of independent Solvers and infrastructure providers that execute cross-chain transfers through the Protocol.</li>
              <li><strong>Third-Party Bridges:</strong> External cross-chain bridging infrastructure (including Chain Signatures, MPC networks, and other bridge solutions) used to transfer assets between blockchains.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section id="service">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            3. Description of Service
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              goBlink is a <strong>non-custodial frontend interface</strong> that enables users to express cross-chain transfer intents and interact with the Protocol. We provide a user-friendly way to access third-party infrastructure across 20+ blockchain networks.
            </p>
            <p>
              <strong>Important clarifications:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Interface Only:</strong> goBlink is a frontend interface. We do NOT operate the Protocol, Execution Network, or any underlying blockchain infrastructure. All cross-chain execution is performed by independent third parties.</li>
              <li><strong>Non-Custodial:</strong> goBlink does not hold, store, or have access to user funds at any time. All transactions are executed on-chain via smart contracts and the Execution Network.</li>
              <li><strong>Third-Party Infrastructure:</strong> Cross-chain transfer execution is performed by the Protocol, Execution Network, Third-Party Bridges, and blockchain networks. goBlink is not responsible for the operation, reliability, security, or availability of these systems.</li>
              <li><strong>No Control Over Execution:</strong> goBlink does not control how Solvers execute intents, which execution paths are chosen, or the final pricing and timing of transactions.</li>
              <li><strong>Auto-Refund:</strong> Failed transfers may trigger automatic refunds through the underlying Protocol infrastructure, though network fees may still apply and are non-refundable.</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section id="eligibility">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            4. Eligibility
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

        {/* Section 5 */}
        <section id="wallet">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            5. Wallet Connection & Authentication
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

        {/* Section 6 */}
        <section id="transactions">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            6. Transactions
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              When you initiate a cross-chain transfer through the Service, the following applies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Quotes Are Estimates:</strong> Token exchange rates, amounts, and fees displayed during the quote process are estimates provided by Solvers and are not guaranteed. The final execution price may differ from the quoted price due to market volatility, slippage, network congestion, or changes between quote time and execution time.</li>
              <li><strong>Slippage:</strong> The actual amount you receive may be less than the quoted amount due to slippage, which occurs when market prices move between the time a quote is generated and when the transaction is executed on-chain.</li>
              <li><strong>No Guarantee of Optimal Execution:</strong> goBlink does not guarantee optimal pricing, execution speed, or Solver reliability. Solvers are independent third parties, and goBlink does not assess, verify, or endorse any Solver's performance, reputation, or execution quality.</li>
              <li><strong>Bridge and Cross-Chain Risks:</strong> Cross-chain transfers rely on Third-Party Bridges, including Chain Signatures, MPC networks, and other bridging infrastructure. These systems involve significant risks, including smart contract vulnerabilities, bridge failures, consensus failures, validator misconduct, and potential permanent loss of assets. goBlink has no control over these systems and is not responsible for bridge failures or losses.</li>
              <li><strong>Irreversibility:</strong> Once a transaction is confirmed on the blockchain, it is <strong>irreversible</strong>. goBlink cannot cancel, reverse, or modify transactions once they are submitted.</li>
              <li><strong>Auto-Refund on Failure:</strong> If a transfer cannot be completed due to technical issues, smart contract errors, or other failures, the Protocol may automatically refund your tokens. However, network fees (gas fees) are non-refundable and may still be deducted.</li>
              <li><strong>No Guarantee of Execution:</strong> goBlink does not guarantee that any transaction will be successfully executed. Transactions may fail due to network congestion, smart contract errors, insufficient liquidity, slippage exceeding limits, Solver unavailability, bridge outages, or other technical issues.</li>
              <li><strong>Network Delays:</strong> Transaction processing times depend on blockchain network conditions, Solver performance, and bridge infrastructure, all of which are beyond goBlink's control. Transfers may take longer than estimated during periods of high network activity.</li>
              <li><strong>User Error:</strong> You are responsible for ensuring that recipient addresses, token selections, amounts, and other transaction details are correct. Tokens sent to incorrect addresses or on incorrect chains may be permanently lost.</li>
            </ul>
            <p>
              <strong>goBlink is not responsible for:</strong> Failed transactions, Solver performance or misconduct, bridge failures, network errors, blockchain forks, smart contract bugs, liquidity issues, slippage, user error, or any losses resulting from transaction execution or non-execution.
            </p>
          </div>
        </section>

        {/* Section 7 - NEW */}
        <section id="no-fiduciary">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            7. No Fiduciary Duty
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              <strong>goBlink does not act as your agent, advisor, fiduciary, or trustee.</strong> We provide a software interface to access third-party infrastructure, and we have no fiduciary relationship or duties to you.
            </p>
            <p>
              You acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>goBlink does not provide financial, investment, legal, or tax advice.</li>
              <li>goBlink does not recommend or endorse any particular transaction, Solver, or blockchain network.</li>
              <li>goBlink has no duty to act in your best interest or to maximize your returns.</li>
              <li>You are solely responsible for evaluating the risks and suitability of any transaction you initiate.</li>
            </ul>
          </div>
        </section>

        {/* Section 8 */}
        <section id="fees">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            8. Fees
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
              <li><strong>Protocol-level fees</strong> (including Solver fees and gas fees) are separate from goBlink's service fees and are paid directly to Solvers and blockchain validators. These fees are set by third parties and are beyond goBlink's control.</li>
              <li><strong>Network fees (gas fees)</strong> are paid directly to blockchain validators and vary based on network congestion.</li>
              <li>All fees are <strong>non-refundable</strong> once a transaction is submitted to the blockchain, regardless of whether the transaction succeeds or fails.</li>
              <li><strong>Fee rounding and minimums:</strong> Fees may be subject to rounding (typically to 2-6 decimal places depending on the token) and minimum fee thresholds to ensure economic viability.</li>
              <li><strong>Anti-circumvention:</strong> You agree not to attempt to bypass, circumvent, or manipulate goBlink's fee mechanisms through any means, including but not limited to routing transactions through multiple intermediaries, exploiting smart contract vulnerabilities, or using automated tools to avoid fee payment.</li>
              <li>goBlink reserves the right to adjust fee tiers at any time. Fee changes will be reflected in the Service, and your use of the Service after such changes constitutes acceptance of the new fees.</li>
            </ul>
          </div>
        </section>

        {/* Section 9 */}
        <section id="prohibited">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            9. Prohibited Uses
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
              <li><strong>Intent Manipulation:</strong> Submitting intents with falsified parameters, spamming the Protocol or Execution Network with bogus intents, or attempting to manipulate intent execution for personal gain.</li>
              <li><strong>Solver Abuse:</strong> Front-running Solver quotes, spamming Solvers with quote requests to cause denial of service, or exploiting Solver pricing mechanisms.</li>
              <li><strong>Cross-Chain Exploits:</strong> Leveraging settlement delays, bridge vulnerabilities, or timing attacks to exploit cross-chain infrastructure for unauthorized financial gain.</li>
              <li><strong>Illegal Activity:</strong> Using the Service for any activity that violates applicable laws or regulations in your jurisdiction.</li>
              <li><strong>Automated Abuse:</strong> Using bots, scrapers, or automated tools to access the Service without explicit written permission from goBlink.</li>
              <li><strong>System Interference:</strong> Attempting to interfere with, disrupt, or compromise the security or integrity of the Service or its underlying infrastructure.</li>
            </ul>
            <p>
              goBlink reserves the right to investigate suspected violations, restrict access, and cooperate with law enforcement authorities. We may terminate or suspend your access to the Service immediately without notice if we suspect prohibited use.
            </p>
          </div>
        </section>

        {/* Section 10 */}
        <section id="ip">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            10. Intellectual Property
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

        {/* Section 11 */}
        <section id="third-party">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            11. Third-Party Services
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              The Service integrates with and relies on third-party services and infrastructure, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Cross-Chain Protocol:</strong> The underlying Protocol that coordinates intent execution</li>
              <li><strong>Execution Network:</strong> Independent third-party Solvers that execute cross-chain transfers</li>
              <li><strong>Routing Infrastructure:</strong> Intent execution and routing services operated by third parties</li>
              <li><strong>Third-Party Bridges:</strong> Cross-chain bridging infrastructure including Chain Signatures, MPC networks, and other bridge solutions</li>
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
              <li>Security breaches, vulnerabilities, or exploits in third-party services, blockchain networks, or bridge infrastructure.</li>
              <li>Changes to third-party APIs, protocols, or terms of service that affect the Service.</li>
            </ul>
            <p>
              Your use of third-party services is subject to their respective terms of service and privacy policies. goBlink makes no warranties or representations regarding third-party services.
            </p>
          </div>
        </section>

        {/* Section 12 */}
        <section id="disclaimers">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            12. Disclaimers
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
              <strong>Cryptocurrency and Blockchain Risk Acknowledgment:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Cryptocurrency transactions involve significant financial risk due to market volatility, regulatory uncertainty, and technical complexity.</li>
              <li>The value of cryptocurrencies can fluctuate dramatically and may result in substantial losses.</li>
              <li><strong>Smart Contract Risks:</strong> The Protocol, Execution Network, Third-Party Bridges, and blockchain networks rely on smart contracts, which may contain bugs, vulnerabilities, or exploits that could result in loss of funds. Smart contracts are immutable once deployed and may not be updatable to fix security issues.</li>
              <li><strong>Bridge and MPC Risks:</strong> Third-Party Bridges, including Chain Signatures and MPC networks, involve cryptographic operations that could be compromised through validator collusion, key theft, consensus failures, or vulnerabilities in MPC protocols. Assets transferred via bridges may be permanently lost if bridge infrastructure fails.</li>
              <li><strong>Quantum Computing Risks:</strong> Future advances in quantum computing could potentially compromise blockchain cryptography, including wallet signatures and bridge security mechanisms.</li>
              <li><strong>Blockchain Forks:</strong> Blockchain networks may undergo forks (planned or unplanned) that could result in transaction reversals, duplicate assets, or loss of funds.</li>
              <li><strong>AI and Algorithmic Solver Limitations:</strong> Solvers may use AI or algorithmic decision-making to route and execute intents. These systems may produce suboptimal results, unexpected behavior, or errors that result in financial losses.</li>
              <li><strong>goBlink does not provide financial, investment, legal, or tax advice.</strong> You should consult qualified professionals before making financial decisions.</li>
              <li>goBlink is not responsible for losses resulting from market volatility, user error, smart contract bugs, bridge failures, Solver misconduct, blockchain network issues, or other technical failures.</li>
            </ul>
            <p>
              <strong>Assumption of Risk and Release:</strong>
            </p>
            <p>
              You expressly acknowledge and agree that you assume full responsibility for all risks associated with using the Service, interacting with the Protocol, Execution Network, Third-Party Bridges, and blockchain networks. You irrevocably waive and release any and all claims against goBlink and its affiliates arising from or related to these risks.
            </p>
          </div>
        </section>

        {/* Section 13 */}
        <section id="liability">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            13. Limitation of Liability
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p className="uppercase font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, GOBLINK AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Indirect, incidental, consequential, punitive, or exemplary damages,</strong> including but not limited to loss of profits, revenue, data, goodwill, or other intangible losses.</li>
              <li><strong>Losses from market volatility,</strong> including fluctuations in cryptocurrency prices or exchange rates.</li>
              <li><strong>Lost, stolen, or compromised funds</strong> resulting from user error, wallet compromise, phishing attacks, smart contract vulnerabilities, bridge failures, Solver misconduct, or unauthorized access.</li>
              <li><strong>Failed transactions,</strong> network congestion, smart contract bugs, bridge outages, Solver unavailability, or blockchain errors.</li>
              <li><strong>Service interruptions,</strong> downtime, data loss, or security breaches.</li>
            </ul>
            <p className="uppercase font-semibold mt-4">
              IN NO EVENT SHALL GOBLINK'S TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) USD $100 OR (B) THE TOTAL FEES PAID BY YOU TO GOBLINK IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.
            </p>
            <p>
              <strong>Exceptions:</strong> Nothing in these Terms excludes or limits goBlink's liability for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Fraud or willful misconduct by goBlink;</li>
              <li>Death or personal injury caused by goBlink's negligence; or</li>
              <li>Any other liability that cannot be excluded or limited by applicable law.</li>
            </ul>
            <p>
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
            </p>
          </div>
        </section>

        {/* Section 14 - NEW */}
        <section id="release">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            14. Release of Claims
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              To the fullest extent permitted by applicable law, you expressly waive and release any and all rights and claims you may have against goBlink and its affiliates, officers, directors, employees, agents, and licensors arising from or related to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your use of the Service;</li>
              <li>The Protocol, Execution Network, or Third-Party Bridges;</li>
              <li>Any transactions initiated through the Service;</li>
              <li>Smart contract vulnerabilities, bridge failures, or blockchain network issues;</li>
              <li>Solver performance, misconduct, or unavailability;</li>
              <li>Market volatility, slippage, or losses; or</li>
              <li>Any other risks described in these Terms.</li>
            </ul>
            <p className="mt-4">
              <strong>California Civil Code Section 1542 Waiver:</strong>
            </p>
            <p>
              If you are a California resident, you expressly waive the benefits and protections of California Civil Code Section 1542, which states:
            </p>
            <p className="italic ml-4">
              "A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected his or her settlement with the debtor or released party."
            </p>
            <p>
              This means you waive any claims you may have against goBlink, even if you do not currently know about them.
            </p>
          </div>
        </section>

        {/* Section 15 */}
        <section id="indemnification">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            15. Indemnification
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

        {/* Section 16 - NEW */}
        <section id="compliance">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            16. Compliance and Tax
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              <strong>You are solely responsible for:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Determining and complying with all applicable tax obligations in your jurisdiction, including income tax, capital gains tax, sales tax, value-added tax (VAT), and any other taxes related to cryptocurrency transactions.</li>
              <li>Accurately reporting cryptocurrency transactions to tax authorities as required by law.</li>
              <li>Maintaining records of all transactions for tax and regulatory purposes.</li>
              <li>Complying with all applicable laws, regulations, and licensing requirements in your jurisdiction.</li>
            </ul>
            <p>
              <strong>Cross-Border Transactions:</strong> Because blockchain transactions are cross-border by nature, multiple jurisdictions may have overlapping or conflicting tax and regulatory authority over your transactions. It is your responsibility to understand and comply with all applicable requirements.
            </p>
            <p>
              goBlink does not provide tax or legal advice and makes no representations regarding the tax treatment of cryptocurrency transactions. Consult a qualified tax professional or attorney for guidance.
            </p>
          </div>
        </section>

        {/* Section 17 - NEW */}
        <section id="not-registered">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            17. Not Registered with Regulatory Authorities
          </h2>
          <div className="space-y-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              <strong>goBlink is not registered with any financial regulatory authority,</strong> including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The U.S. Securities and Exchange Commission (SEC);</li>
              <li>The Commodity Futures Trading Commission (CFTC);</li>
              <li>The Financial Crimes Enforcement Network (FinCEN);</li>
              <li>The Financial Conduct Authority (FCA) in the United Kingdom; or</li>
              <li>Any other securities regulator, commodities regulator, or financial authority in any jurisdiction.</li>
            </ul>
            <p>
              <strong>goBlink is not:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>A broker, broker-dealer, or investment advisor;</li>
              <li>A financial institution, bank, or money services business;</li>
              <li>An exchange, trading platform, or marketplace operator;</li>
              <li>A custodian or trust company; or</li>
              <li>Subject to regulatory oversight or consumer protection laws applicable to such entities.</li>
            </ul>
            <p>
              The Service is provided as a software interface to access decentralized infrastructure. You acknowledge that you are not entitled to the regulatory protections that would apply if goBlink were a registered financial services provider.
            </p>
          </div>
        </section>

        {/* Section 18 */}
        <section id="privacy">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            18. Privacy
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

        {/* Section 19 */}
        <section id="modifications">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            19. Modifications
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

        {/* Section 20 */}
        <section id="governing-law">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            20. Governing Law
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

        {/* Section 21 */}
        <section id="disputes">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            21. Dispute Resolution
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
              <strong>Time Limitation on Claims:</strong> You agree that any claim or dispute arising out of or relating to these Terms or the Service must be filed within <strong>one (1) year</strong> after the claim or dispute arose. Any claims filed after this one-year period are permanently barred.
            </p>
            <p>
              <strong>Waiver of Class Actions:</strong> You agree to resolve disputes on an individual basis only and expressly waive any right to participate in class actions, class arbitrations, representative proceedings, or any other form of collective action. You may not consolidate or join your claim with claims of other users. This class action waiver is a material term of these Terms, and if found unenforceable, the arbitration agreement shall be void.
            </p>
          </div>
        </section>

        {/* Section 22 */}
        <section id="severability">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            22. Severability
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

        {/* Section 23 */}
        <section id="contact">
          <h2 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
            23. Contact
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
