/**
 * DriveLedger — Comprehensive Legal, Liability, Privacy & Regulatory Policy Suite
 * Dynamically bound to `src/config/monetizationConfig.js`.
 * Written in full, formal, multi-paragraph English legal prose with zero placeholders.
 */

import { MONETIZATION_CONFIG } from '../config/monetizationConfig.js';

const { brandName, domain, contactEmail, legalEmail, lastUpdated } = MONETIZATION_CONFIG;

export const NOMINATIVE_FAIR_USE_NOTICE =
  'Independent Platform & Trademark Notice: This website is an independent automotive cost and diagnostic research tool. It is not affiliated with, endorsed by, sponsored by, or officially connected to Ford, BMW, Toyota, Volkswagen, Tesla, Honda, Audi, Mercedes-Benz, or any other vehicle manufacturer mentioned in our catalog. All manufacturer names, vehicle model names, engine designations, trademarks, and photographic representations are used strictly for nominative fair use, vehicle identification, and comparative consumer analysis.';

export const ADSENSE_DART_COOKIE_CLAUSE =
  'Third-Party Advertising & Google AdSense: We use Google AdSense and third-party advertising companies to serve ads when you visit our website. Google, as a third-party vendor, uses cookies (including the Google DoubleClick DART cookie) to serve ads to our site visitors based upon their visit to our website and other sites on the Internet. Users may opt out of personalized advertising by visiting Google Ads Settings at https://myadcenter.google.com/ or https://www.aboutads.info/choices/ (US) and https://www.youronlinechoices.eu/ (EU/UK).';

export const AMAZON_ASSOCIATES_CLAUSE =
  'As an Amazon Associate, we earn from qualifying purchases.';

export const WORKSPACE_LEGAL_NOTICE_LINE =
  `Informational Estimate Notice: All TCO, depreciation, and OBD-II repair figures on ${brandName} (${domain}) are statistical projections, not certified mechanical or financial advice. Independent platform; all OEM trademarks used strictly under nominative fair use. Partner links may earn a commission at no extra cost to you.`;

export const LEGAL_HASH_ROUTES = [
  '#privacy',
  '#terms',
  '#disclaimer',
  '#affiliate-disclosure',
  '#cookies',
  '#do-not-sell',
  '#about',
  '#contact',
];

export const LEGAL_CLEAN_ROUTES = [
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
  '/affiliate-disclosure',
  '/do-not-sell',
  '/about',
  '/contact',
];

const HASH_TO_POLICY_KEY = {
  // Clean paths
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/disclaimer': 'disclaimer',
  '/cookies': 'cookies',
  '/affiliate-disclosure': 'affiliate-disclosure',
  '/affiliate': 'affiliate-disclosure',
  '/do-not-sell': 'do-not-sell',
  '/donotsell': 'do-not-sell',
  // Bare keys
  privacy: 'privacy',
  terms: 'terms',
  disclaimer: 'disclaimer',
  'affiliate-disclosure': 'affiliate-disclosure',
  affiliate: 'affiliate-disclosure',
  cookies: 'cookies',
  'do-not-sell': 'do-not-sell',
  donotsell: 'do-not-sell',
  about: 'about',
  contact: 'contact',
  // Hash routes
  '#privacy': 'privacy',
  '#terms': 'terms',
  '#disclaimer': 'disclaimer',
  '#affiliate-disclosure': 'affiliate-disclosure',
  '#affiliate': 'affiliate-disclosure',
  '#cookies': 'cookies',
  '#do-not-sell': 'do-not-sell',
  '#donotsell': 'do-not-sell',
  '#about': 'about',
  '#methodology': 'about',
  '#contact': 'contact',
};

export function resolveLegalPolicyKey(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const cleaned = rawInput.trim().toLowerCase();

  // Collision guard: /about, /contact, /guides, /methodology are standalone application tabs, NOT legal modal popups
  if (
    cleaned === '/about' ||
    cleaned.startsWith('/about/') ||
    cleaned === '/contact' ||
    cleaned.startsWith('/contact/') ||
    cleaned === '/guides' ||
    cleaned.startsWith('/guides/') ||
    cleaned === '/methodology' ||
    cleaned.startsWith('/methodology/') ||
    cleaned === 'methodology'
  ) {
    return null;
  }

  // Normalize by stripping trailing slash for paths (e.g. /privacy/ -> /privacy)
  const normalized = cleaned.length > 1 && cleaned.endsWith('/') ? cleaned.slice(0, -1) : cleaned;

  return HASH_TO_POLICY_KEY[normalized] || null;
}

export const LEGAL_POLICIES = {
  terms: {
    id: 'terms',
    hash: '#terms',
    shortLabel: 'Terms of Service',
    title: 'Terms of Service, Liability Shield & Mathematical Disclaimers',
    subtitle: `Binding Conditions of Use, Workshop Safety Waiver & Nominative Trademark Notice — Effective & Last Updated: ${lastUpdated}`,
    lastUpdated,
    sections: [
      {
        heading: '1. Binding Agreement and Scope of Platform Services',
        paragraphs: [
          `Welcome to ${brandName} (accessible at https://${domain}), an independent automotive cost intelligence, lifecycle depreciation, powertrain maintenance risk, and On-Board Diagnostics (OBD-II) research platform. By accessing, browsing, or utilizing any calculator, telemetry simulation, pre-purchase inspection checklist, or diagnostic dossier on https://${domain}, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service and our Comprehensive Liability Shield.`,
          `If you do not agree to every provision set forth in these Terms of Service, you are not authorized to rely upon or utilize the mathematical models, repair range estimates, or comparative vehicle reports generated by ${brandName} and must discontinue use of the platform immediately.`,
        ],
      },
      {
        heading: '2. No Financial, Tax, Lending, or Insurance Advice',
        paragraphs: [
          `All True Cost to Own (TCO) figures, 5-year and 10-year non-linear depreciation curves, residual value projections, monthly loan payment simulations, Annual Percentage Rate (APR) amortization schedules, fuel and electrical energy expenditure models, and motor insurance estimates presented on ${brandName} are statistical mathematical projections for informational and educational purposes only. They do not constitute certified financial planning advice, accounting or tax counsel, binding consumer loan offers, credit underwriting commitments, or regulated insurance quotes.`,
          `Actual vehicle ownership expenditures vary materially based upon regional market volatility, individual creditworthiness, underwriting criteria, driving history, garaging postcode, taxation rules, and macroeconomic fuel or electricity tariffs. You must consult a licensed financial advisor, certified public accountant, authorized lending institution, or licensed insurance broker before executing any vehicle purchase, lease, refinancing agreement, or insurance contract.`,
        ],
      },
      {
        heading: '3. No Certified Automotive Mechanic Advice & Workshop Safety Waiver',
        paragraphs: [
          `All Maintenance Risk Matrix schedules, thermodynamic urban duty-cycle wear multipliers, "Fix It or Sell It" decision ratios, Pre-Purchase Inspection (PPI) checklists, and OBD-II fault code repair estimates (including but not limited to P0420, P2002, P0171, P0300, P0299, P0401, P0128, P0700, P0A80, and U0100) provided on ${brandName} are statistical guides only. Nothing on this website constitutes certified automotive diagnostic engineering or professional mechanical repair instruction.`,
          `An SAE J1979 / ISO 15031 OBD-II Diagnostic Trouble Code (DTC) indicates that a vehicle electronic control module has detected a sensor voltage, pressure, temperature, or circuit parameter outside normal factory thresholds; it is NOT a guaranteed or definitive directive to replace any specific mechanical or electronic component. Identical fault codes frequently originate from wiring harness chafing, corroded ground straps, vacuum leaks, exhaust pinhole leaks, or degraded 12-volt battery voltage rather than catastrophic assembly failure. Users must always obtain a physical, hands-on diagnostic inspection from an ASE-certified master technician (or manufacturer-authorized workshop) utilizing factory-grade oscilloscopes, smoke testers, and bi-directional scan tools before purchasing replacement parts or authorizing workshop repairs.`,
        ],
      },
      {
        heading: '4. Assumption of Risk & Comprehensive Limitation of Liability',
        paragraphs: [
          `Inspecting, diagnosing, testing, or performing maintenance on motor vehicles involves severe and potentially fatal physical hazards, including but not limited to lethal high-voltage electric vehicle (EV) and hybrid traction battery systems (300V–800V DC), high-pressure common-rail diesel and direct-injection fuel lines exceeding 2,000 bar, scalding pressurized cooling systems, toxic exhaust gases, rotating engine accessory drives, pyrotechnic supplemental restraint (airbag) systems, and structural crushing hazards associated with hydraulic jacks or vehicle lifts.`,
          `You expressly assume all physical, mechanical, and financial risks associated with inspecting, operating, or servicing any motor vehicle. To the maximum extent permitted by applicable statutory and common law, ${brandName}, its owners, principal engineers, affiliates, licensors, and contributors shall not be liable for any direct, indirect, incidental, consequential, special, or exemplary damages—including without limitation catastrophic engine or transmission failure, improper repair, misdiagnosed fault codes, voided manufacturer or aftermarket warranties, diminished vehicle resale value, overpayment on a vehicle purchase, personal injury, or wrongful death—arising out of or connected with your access to, use of, or reliance upon any content, calculator, or partner link on https://${domain}.`,
        ],
      },
      {
        heading: '5. Nominative Fair Use & Intellectual Property Notice',
        paragraphs: [
          NOMINATIVE_FAIR_USE_NOTICE,
          `All proprietary mathematical algorithms, source code, user interface layouts, and original technical editorial analyses published on https://${domain} are the exclusive intellectual property of ${brandName}. Automated scraping, bulk commercial redistribution, or framing of this platform without prior written authorization from ${legalEmail} is strictly prohibited.`,
        ],
      },
    ],
  },

  disclaimer: {
    id: 'disclaimer',
    hash: '#disclaimer',
    shortLabel: 'Liability Disclaimer',
    title: 'Comprehensive Automotive, Financial & Trademark Liability Disclaimer',
    subtitle: `Mandatory Consumer Risk Disclosures, Workshop Safety Waiver & Nominative Fair Use Declaration — Last Updated: ${lastUpdated}`,
    lastUpdated,
    sections: [
      {
        heading: '1. Statistical Financial & Depreciation Projections Only',
        paragraphs: [
          `All True Cost to Own (TCO) figures, 5-year depreciation curves, monthly payment simulations, APR calculations, and insurance estimates on ${brandName} (https://${domain}) are statistical mathematical projections for informational and educational purposes only. They do not constitute financial advice, binding loan offers, or insurance quotes. Market resale values depend on physical vehicle condition, regional supply and demand, accident history, and trim-level equipment that cannot be guaranteed by an algorithmic model.`,
        ],
      },
      {
        heading: '2. OBD-II Diagnostic Estimates & Workshop Safety Waiver',
        paragraphs: [
          `Maintenance Risk schedules, component wear multipliers, and OBD-II fault code estimates (such as P0420, P2002, P0171, P0300, P0299, and P0A80) are statistical guides only. An OBD-II trouble code indicates a sensor or circuit parameter abnormality, NOT a guaranteed directive to replace a specific part. Users must always obtain a physical inspection from an ASE-certified (or manufacturer-authorized) technician before purchasing parts or performing repairs.`,
          `Working on motor vehicles involves severe hazards (high-voltage EV/hybrid batteries, pressurized fuel rails, hot exhaust systems, vehicle lifting). To the maximum extent permitted by law, ${brandName}, its owners, and contributors shall not be liable for any mechanical damage, improper repair, voided warranty, personal injury, or financial loss arising from the use of this website.`,
        ],
      },
      {
        heading: '3. Nominative Fair Use & OEM Trademark Disclaimer',
        paragraphs: [
          NOMINATIVE_FAIR_USE_NOTICE,
          `Any rights holder or manufacturer representative with inquiries regarding nominative references or Wikimedia Commons photographic attributions may contact our legal compliance desk directly at ${legalEmail}.`,
        ],
      },
    ],
  },

  privacy: {
    id: 'privacy',
    hash: '#privacy',
    shortLabel: 'Privacy Policy',
    title: 'Privacy Policy & Telemetry Data Governance (GDPR, UK GDPR & CCPA/CPRA Compliant)',
    subtitle: `Client-Side Architecture, Google AdSense (ca-pub-6581535125716295) Disclosures, IAB TCF v2.2 & Statutory US State Privacy Rights — Last Updated: ${lastUpdated}`,
    lastUpdated,
    sections: [
      {
        heading: '1. Client-Side Privacy Guarantee & Zero Personal Financial Profiling',
        paragraphs: [
          `${brandName} (https://${domain}) adheres to strict privacy-by-design and data-minimization engineering principles. All calculator slider inputs, vehicle purchase prices, annual mileage entries, odometer readings, driving duty-cycle distributions, financing APR parameters, and vehicle selections are computed locally within your web browser's client-side JavaScript runtime.`,
          `We do not require user account registration, and your interactive calculator inputs are never transmitted to, stored on, or sold from our servers as personal financial profiles. Saved vehicles in "My Garage", unit preferences (US / UK / EU), theme selections, and cookie consent choices are stored exclusively in your browser's local storage (window.localStorage) on your own device and can be cleared by you at any time.`,
        ],
      },
      {
        heading: '2. Third-Party Advertising, Google AdSense & DoubleClick Cookie Disclosures',
        paragraphs: [
          ADSENSE_DART_COOKIE_CLAUSE,
          `We use Google AdSense (Publisher ID: ca-pub-6581535125716295) and Google-certified third-party advertising partners to deliver display advertisements across https://${domain}. Google, as a third-party vendor, uses cookies (including the DoubleClick / AdSense advertising cookie) to serve advertisements based upon your visit to our website and other websites across the Internet.`,
          `When advertisements are delivered on our platform, Google and certified advertising technology partners may automatically receive standard HTTP network metadata—such as your Internet Protocol (IP) address, browser user-agent string, coarse geographic location (country or metropolitan area), and requested URL—in order to evaluate ad delivery, frequency capping, fraud prevention, and invalid traffic filtering. You can review how Google processes personal data by visiting Google's Partner Sites Policy at https://policies.google.com/technologies/partner-sites.`,
        ],
      },
      {
        heading: '3. European Economic Area (EEA), UK & Switzerland (GDPR & IAB TCF v2.2)',
        paragraphs: [
          `If you access ${brandName} from the European Economic Area (EEA), the United Kingdom, or Switzerland, the processing of your personal information is governed by Regulation (EU) 2016/679 (General Data Protection Regulation / GDPR) and the UK Data Protection Act 2018, adhering strictly to the Interactive Advertising Bureau (IAB Europe) Transparency and Consent Framework (TCF v2.2).`,
          `Google AdSense & Advertising Cookies: We deploy Google AdSense (Publisher ID: ca-pub-6581535125716295) across https://${domain}. Google, as a third-party vendor, uses advertising cookies (including the DoubleClick / AdSense cookie) to serve advertisements based upon your prior visits to our platform and other websites on the Internet. You can review how Google processes personal data by consulting Google's Partner Sites Policy at https://policies.google.com/technologies/partner-sites.`,
          `Legal Bases for Processing: (a) Consent (GDPR Article 6(1)(a)): In compliance with statutory requirements, we request your prior, explicit, and freely given consent via a certified Consent Management Platform (CMP) or consent banner before storing non-essential cookies, accessing device identifiers, or serving personalized advertisements tailored to your past browsing habits. (b) Legitimate Interest (GDPR Article 6(1)(f)): Where permitted under IAB TCF v2.2 specifications, certain basic operational functions—such as delivering non-personalized advertisements, measuring aggregate ad impressions, verifying ad viewability, combating click fraud, and ensuring infrastructure security—rely upon legitimate interests.`,
          `Personalized vs. Non-Personalized Ad Serving: If you grant consent for personalized advertising, Google AdSense uses cookies and mobile ad identifiers to personalize the advertisements you see. If you refuse or withdraw consent, Google AdSense serves non-personalized advertisements (NPAs) that are contextual rather than behavioral, using cookies solely for frequency capping, aggregate reporting, and fraud prevention.`,
          `Statutory Data Subject Rights (GDPR Articles 12–23): Under European law, you possess comprehensive statutory rights, including: the Right to Access your data (Article 15); the Right to Rectification (Article 16); the Right to Erasure / "Right to be Forgotten" (Article 17); the Right to Restrict processing (Article 18); the Right to Data Portability (Article 20); the Right to Object to processing based on legitimate interests or direct marketing (Article 21); and the Right not to be subjected to Automated Decision-Making (Article 22).`,
          `Consent Withdrawal & Modification: You have the unqualified right to withdraw or modify your consent preferences at any time. You can invoke Google's official revocation dialog or our internal cookie management interface by clicking "Privacy & Cookie Settings (EU/UK)" in our global website footer or by adjusting browser cookie settings. Withdrawal does not affect the lawfulness of processing undertaken prior to revocation. For regulatory inquiries, contact our Data Protection Desk at ${legalEmail} or ${contactEmail}.`,
        ],
      },
      {
        heading: '4. Your US State Privacy Rights & Do Not Sell or Share My Personal Information',
        paragraphs: [
          `This dedicated section applies to residents of California, Virginia, Colorado, Connecticut, Utah, and other US states enacting comprehensive consumer privacy legislation, including the California Consumer Privacy Act of 2018 as amended by the California Privacy Rights Act of 2020 (CCPA / CPRA, Cal. Civ. Code § 1798.100 et seq.), the Virginia Consumer Data Protection Act (VCDPA), the Colorado Privacy Act (CPA), and the Connecticut Data Privacy Act (CTDPA).`,
          `Right to Opt-Out of Sale or Sharing for Cross-Context Behavioral Advertising: US state laws grant consumers the statutory right to opt out of the "sale" or "sharing" of personal information, as well as the right to opt out of targeted advertising. While ${brandName} does not sell your personal information for monetary payment, our use of third-party advertising cookies via Google AdSense (ca-pub-6581535125716295) for cross-context behavioral ad delivery may be characterized as "sharing" or "targeted advertising" under statutory provisions.`,
          `Global Privacy Control (GPC) Signal Support: We support and automatically respect frictionless Universal Opt-Out Preference Signals, including the Global Privacy Control (GPC). If your browser or operating system broadcasts an active GPC signal (navigator.globalPrivacyControl === true), our systems recognize this signal as a valid and binding directive to opt out of the sale, sharing, and targeted advertising usage of your browser telemetry.`,
          `Categories of Data Collected & Disclosed: Over the past 12 months, we have collected and disclosed for business purposes: (a) Identifiers: Internet Protocol (IP) addresses, unique pseudonymous cookie identifiers, browser user-agent strings, and device fingerprints; (b) Internet or Network Activity Information: interaction timestamps, vehicle preset models viewed, and OBD-II trouble code queries. We DO NOT collect, process, or disclose sensitive personal information (such as Social Security numbers, financial account credentials, precise geolocation, or racial/ethnic origin).`,
          `Non-Discrimination Guarantee: Pursuant to CCPA / CPRA § 1798.125 and comparable state laws, we will never discriminate against you for exercising any statutory privacy right. Opting out will never result in denied access to our automotive calculators, slower calculation runtimes, or altered service terms.`,
          `How to Exercise Your Opt-Out Rights: You may exercise your right to opt out at any time by: (a) Visiting https://${domain}/do-not-sell directly; (b) Clicking "Do Not Sell or Share My Personal Information (US)" in the website footer; (c) Transmitting an automated Global Privacy Control (GPC) signal; or (d) Submitting a verified consumer request to our compliance desk at ${legalEmail}.`,
        ],
      },
      {
        heading: '5. Outbound Affiliate Links & Third-Party Merchant Privacy',
        paragraphs: [
          `Our calculators contain contextual partner links to third-party automotive platforms (such as VIN history registries, diagnostic hardware retailers, OEM parts catalogs, and insurance comparison marketplaces). When you voluntarily click an outbound partner link, your browser navigates to that third-party domain with a standard referral tracking parameter. ${brandName} does not receive any personal identity, payment card, or VIN query data that you subsequently submit on a third-party partner website; such interactions are governed solely by the privacy policy of the destination merchant.`,
        ],
      },
      {
        heading: '6. Data Retention, International Transfers & Supervisory Authorities',
        paragraphs: [
          `Because all calculation data is handled client-side in browser memory, ${brandName} retains no centralized repository of user financial or vehicle ownership inputs. Pseudonymous server logs collected for edge security and CDN caching (via Cloudflare, Inc.) are automatically purged on a rolling 30-day lifecycle.`,
          `If you believe that our processing of personal data infringes applicable data protection statutes, you have the right to lodge a complaint with your competent supervisory authority (such as your EU Member State Data Protection Authority, the UK Information Commissioner's Office, or the California Privacy Protection Agency).`,
        ],
      },
    ],
  },

  cookies: {
    id: 'cookies',
    hash: '#cookies',
    shortLabel: 'Cookie Policy',
    title: 'GDPR / CCPA Cookie & Local Storage Governance Policy',
    subtitle: `Technical Specification of First-Party Local Storage, Google AdSense (ca-pub-6581535125716295) Cookies & Granular Opt-Out Controls — Last Updated: ${lastUpdated}`,
    lastUpdated,
    sections: [
      {
        heading: '1. Technical Architecture of First-Party Local Storage & Essential Storage',
        paragraphs: [
          `${brandName} (https://${domain}) utilizes strictly necessary HTML5 Local Storage keys to preserve your user-interface configuration across browser sessions, alongside optional third-party advertising cookies that are strictly governed by your explicit consent preferences.`,
          `Essential First-Party Local Storage Keys include: "shiftmetric_theme" (persists Light or Dark display mode), "shiftmetric_unit_region" (persists US, UK, or EU currency, distance, and consumption units), "shiftmetric_garage_v1" (stores your bookmarked vehicle presets locally on your device), and "shiftmetric_cookie_consent" (records your GDPR/CCPA privacy banner selection). These essential keys are stored solely on your client device, never leave your browser, and do not track your activity across third-party websites.`,
        ],
      },
      {
        heading: '2. Google AdSense (ca-pub-6581535125716295) & DoubleClick Advertising Cookies',
        paragraphs: [
          `When third-party advertising is active on https://${domain}, Google AdSense (Publisher ID: ca-pub-6581535125716295) and Google-certified vendor networks deploy HTTP cookies (including the DoubleClick / AdSense cookie) to measure ad delivery, prevent click fraud, and serve personalized or contextually relevant advertisements.`,
          `Personalized Advertising: When consent is granted, advertising cookies store pseudonymous identifiers that allow Google and its ad partners to serve advertisements tailored to your interests based upon your previous visits to this and other websites across the web.`,
          `Non-Personalized Advertising: When consent for personalized ads is refused or revoked, Google AdSense delivers non-personalized ads (NPAs). NPAs do not rely upon past user behavior profiles, but still utilize cookies strictly for frequency capping, aggregated ad reporting, and combating invalid traffic or fraud. Review Google's official privacy practices at https://policies.google.com/technologies/partner-sites.`,
        ],
      },
      {
        heading: '3. European Economic Area (EEA), UK & Switzerland (GDPR & IAB TCF v2.2)',
        paragraphs: [
          `In adherence to Regulation (EU) 2016/679 (GDPR), the UK Data Protection Act 2018, and IAB Europe Transparency and Consent Framework (TCF v2.2) standards, our deployment of third-party advertising cookies via Google AdSense (Publisher ID: ca-pub-6581535125716295) and Google-certified vendor networks is strictly governed by European privacy mandates:`,
          `(a) Google AdSense & DoubleClick Cookies: Google, as a third-party vendor, uses advertising cookies (including the DoubleClick / AdSense cookie) to serve advertisements based upon your prior visits to our platform and other websites on the Internet. You can review how Google processes personal data by visiting Google's Partner Sites Policy at https://policies.google.com/technologies/partner-sites.`,
          `(b) Legal Basis of Consent (GDPR Art. 6(1)(a)): Storing and accessing non-essential cookies and processing personal data for personalized advertising, audience measurement, and content profiling requires your prior affirmative consent, captured through our certified CMP or cookie banner.`,
          `(c) Legal Basis of Legitimate Interest (GDPR Art. 6(1)(f)): Where recognized under IAB TCF v2.2, select technical vendors may rely on legitimate interests for strictly technical ad delivery, security auditing, and fraud suppression.`,
          `(d) Personalized vs. Non-Personalized Ad Serving: When consent for personalized ads is granted, cookies store pseudonymous identifiers to tailor advertisements to your interests. When consent is refused or revoked, Google AdSense delivers non-personalized ads (NPAs) that rely only on contextual information, utilizing cookies solely for frequency capping, aggregated ad reporting, and combatting invalid traffic.`,
          `(e) Consent Revocation & Modification: You have the statutory right to withdraw or modify your cookie consent at any moment by clicking "Privacy & Cookie Settings (EU/UK)" in our website footer, which launches Google's official revocation interface or our internal cookie management tool.`,
        ],
      },
      {
        heading: '4. Your US State Privacy Rights & Do Not Sell or Share My Personal Information',
        paragraphs: [
          `Under the California Consumer Privacy Act of 2018 as amended by the California Privacy Rights Act of 2020 (CCPA / CPRA, Cal. Civ. Code § 1798.100 et seq.), the Virginia Consumer Data Protection Act (VCDPA), the Colorado Privacy Act (CPA), the Connecticut Data Privacy Act (CTDPA), and comparable state enactments, consumers possess the affirmative statutory right to direct businesses not to "sell" or "share" their personal information for cross-context behavioral advertising or targeted advertising.`,
          `${brandName} (https://${domain}) does not sell personal information to third parties in exchange for monetary consideration. However, our deployment of third-party advertising cookies and scripts via Google AdSense (ca-pub-6581535125716295) and DoubleClick ad services to deliver tailored automotive advertisements may be classified as "sharing" or "targeted advertising" under applicable US state statutes.`,
          `Global Privacy Control (GPC) Automated Opt-Out Recognition: We fully support and automatically respect frictionless opt-out preference signals transmitted by your browser runtime, specifically the Global Privacy Control (GPC) signal (navigator.globalPrivacyControl === true). When our platform detects an active GPC signal broadcast by your web browser (such as Brave, Mozilla Firefox, or DuckDuckGo) or through a verified privacy extension, we automatically suppress optional third-party cross-context behavioral advertising cookies and scripts without requiring any secondary interactive action.`,
          `Categories of Personal Information Collected and Disclosed: (a) Online Identifiers: Pseudonymous cookie IDs, Google advertising IDs, coarse IP geolocation (city/state level), and browser user-agent telemetry; (b) Internet Network Activity: Timestamps of platform interactions, vehicle presets evaluated, and OBD-II trouble code dossiers consulted. Categories NOT Collected: We do not collect names, physical postal addresses, telephone numbers, payment card numbers, vehicle identification numbers (VINs), credit scores, or sensitive personal information. All automotive calculation parameters are processed exclusively in client-side browser memory.`,
          `Non-Discrimination Guarantees: Pursuant to CCPA / CPRA § 1798.125 and comparable state statutory provisions, ${brandName} will never discriminate against you for exercising your privacy rights. Opting out will never result in denied access to our calculators, diminished mathematical precision, degraded site functionality, or differential service levels.`,
          `How to Exercise Your Opt-Out Rights: You may exercise your opt-out rights at any time by: (a) Visiting https://${domain}/do-not-sell directly; (b) Clicking "Do Not Sell or Share My Personal Information (US)" in the website footer; (c) Enabling Global Privacy Control (GPC) in your browser settings; or (d) Submitting a verified consumer request to our compliance desk at ${legalEmail}.`,
        ],
      },
      {
        heading: '5. Granular Cookie Management, Browser Controls & Industry-Wide Opt-Outs',
        paragraphs: [
          `In addition to using the interactive controls in our site footer, you can control and remove cookies through your web browser configuration (Chrome, Safari, Firefox, Edge, or Brave). You can configure your browser to reject all third-party cookies or alert you when a cookie is placed.`,
          `Industry-Wide Advertising Opt-Out Portals: You may opt out of interest-based advertising from participating ad networks by visiting: Google Ads Settings (https://myadcenter.google.com/), Digital Advertising Alliance US (https://www.aboutads.info/choices/), European Interactive Digital Advertising Alliance (https://www.youronlinechoices.eu/), and Network Advertising Initiative (https://optout.networkadvertising.org/).`,
        ],
      },
    ],
  },

  'do-not-sell': {
    id: 'do-not-sell',
    hash: '#do-not-sell',
    path: '/do-not-sell',
    shortLabel: 'Do Not Sell or Share',
    title: 'Do Not Sell or Share My Personal Information & US State Privacy Rights',
    subtitle: `Statutory Consumer Opt-Out Controls under CCPA, CPRA, VCDPA, CPA & CTDPA — Last Updated: ${lastUpdated}`,
    lastUpdated,
    sections: [
      {
        heading: '1. Notice of Statutory Right to Opt-Out of Sale or Sharing of Personal Information',
        paragraphs: [
          `Under the California Consumer Privacy Act of 2018 as amended by the California Privacy Rights Act of 2020 (CCPA / CPRA, Cal. Civ. Code § 1798.100 et seq.), the Virginia Consumer Data Protection Act (VCDPA), the Colorado Privacy Act (CPA), the Connecticut Data Privacy Act (CTDPA), and comparable state enactments, consumers possess the affirmative statutory right to direct businesses not to "sell" or "share" their personal information for cross-context behavioral advertising or targeted advertising.`,
          `${brandName} (https://${domain}) does not sell personal information to third parties in exchange for monetary consideration. However, our deployment of third-party advertising cookies and scripts via Google AdSense (ca-pub-6581535125716295) and DoubleClick ad services to deliver tailored automotive advertisements may be classified as "sharing" or "targeted advertising" under applicable US state statutes.`,
        ],
      },
      {
        heading: '2. Global Privacy Control (GPC) Automated Opt-Out Recognition',
        paragraphs: [
          `We fully support and automatically respect frictionless opt-out preference signals transmitted by your browser runtime, specifically the Global Privacy Control (GPC) signal (navigator.globalPrivacyControl === true).`,
          `When our platform detects an active GPC signal broadcast by your web browser (such as Brave, Mozilla Firefox, or DuckDuckGo) or through a verified privacy extension, we automatically suppress optional third-party cross-context behavioral advertising cookies and scripts without requiring any secondary interactive action.`,
        ],
      },
      {
        heading: '3. Categories of Personal Information Collected and Disclosed',
        paragraphs: [
          `Categories of Personal Information Collected: (a) Online Identifiers: Pseudonymous cookie IDs, Google advertising IDs, coarse IP geolocation (city/state level), and browser user-agent telemetry; (b) Internet Network Activity: Timestamps of platform interactions, vehicle presets evaluated, and OBD-II trouble code dossiers consulted.`,
          `Categories NOT Collected: We do not collect names, physical postal addresses, telephone numbers, payment card numbers, vehicle identification numbers (VINs), credit scores, or sensitive personal information. All automotive calculation parameters are processed exclusively in client-side browser memory.`,
        ],
      },
      {
        heading: '4. Non-Discrimination Guarantees',
        paragraphs: [
          `Pursuant to CCPA / CPRA § 1798.125 and comparable state statutory provisions, ${brandName} will never discriminate against you for exercising your privacy rights. Opting out will never result in denied access to our calculators, diminished mathematical precision, degraded site functionality, or differential service levels.`,
        ],
      },
      {
        heading: '5. How to Exercise Your Opt-Out Rights',
        paragraphs: [
          `You may exercise your opt-out rights through any of the following mechanisms:`,
          `(a) Interactive Settings: Click "Manage Cookie Preferences" or "Privacy & Cookie Settings (EU/UK)" in our site footer and select "Essential Only".`,
          `(b) Automated Browser Signals: Enable Global Privacy Control (GPC) in your browser settings.`,
          `(c) Industry-Wide Opt-Outs: Visit the Digital Advertising Alliance Consumer Choice tool at https://www.aboutads.info/choices/ or the Network Advertising Initiative Opt-Out tool at https://optout.networkadvertising.org/.`,
          `(d) Direct Consumer Privacy Inquiries: Transmit a verified consumer request to our compliance desk at ${legalEmail}.`,
        ],
      },
    ],
  },

  'affiliate-disclosure': {
    id: 'affiliate-disclosure',
    hash: '#affiliate-disclosure',
    shortLabel: 'Affiliate Disclosure',
    title: 'FTC Affiliate Disclosure & Editorial Independence Notice',
    subtitle: `Full Compliance with US FTC 16 CFR Part 255 & Amazon Associates Program Operating Agreement — Last Updated: ${lastUpdated}`,
    lastUpdated,
    sections: [
      {
        heading: '1. FTC 16 CFR Part 255 Material Connection Disclosure',
        paragraphs: [
          `In accordance with the United States Federal Trade Commission (FTC) Guides Concerning the Use of Endorsements and Testimonials in Advertising (16 CFR Part 255), the UK Competition and Markets Authority (CMA) transparency guidelines, and European Union Unfair Commercial Practices Directive standards, ${brandName} (https://${domain}) discloses that we maintain commercial affiliate relationships with select automotive data, diagnostic hardware, replacement parts, and insurance comparison providers.`,
          `When you click on a partner call-to-action button or hyperlink marked with a "Partner link" or "Sponsored" disclosure on our platform and subsequently complete a qualifying purchase, VIN history check, or rate inquiry on the partner's website, ${brandName} may receive a referral fee or affiliate commission. This commission comes at zero additional cost to you—the price you pay on the partner's website is identical whether you access it through ${brandName} or visit the vendor directly.`,
        ],
      },
      {
        heading: '2. Mandatory Amazon Associates Disclosure',
        paragraphs: [
          AMAZON_ASSOCIATES_CLAUSE,
          `Specifically, contextual links recommending Bluetooth OBD-II diagnostic scanners, battery testers, and automotive service equipment may direct users to Amazon.com or regional Amazon storefronts under the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon properties.`,
        ],
      },
      {
        heading: '3. Strict Firewall Between Monetization and Mathematical Algorithms',
        paragraphs: [
          `Reader trust and engineering accuracy are the foundation of ${brandName}. Revenue generated from contextual partner links and display advertising funds our cloud infrastructure, ongoing NHTSA/EPA telemetry dataset updates, and free public access to our calculators without paywalls or mandatory user sign-ups.`,
          `Our commercial partnerships never influence, alter, or bias our mathematical calculations. Every 5-year depreciation curve, thermodynamic urban wear multiplier, "Fix It or Sell It" verdict, and OBD-II fault probability distribution is computed deterministically from empirical market residuals, SAE J1979 diagnostic standards, and published workshop labor times. No automaker, dealership group, warranty provider, or affiliate partner can pay to alter a vehicle's Ownership Value Score or reliability rating on ${brandName}.`,
        ],
      },
    ],
  },

  about: {
    id: 'about',
    hash: '#about',
    shortLabel: 'About & Methodology',
    title: `About ${brandName} — Independent Car Cost & Reliability Tool`,
    subtitle: `How We Estimate Ownership Costs, Maintenance Risks & Repair Prices — Last Updated: ${lastUpdated}`,
    lastUpdated,
    sections: [
      {
        heading: '1. What DriveLedger Is & Who It Is For',
        paragraphs: [
          `${brandName} (https://${domain}) is a free, independent web application built for used-car buyers and vehicle owners across the United States, the United Kingdom, and the European Union. Most buyers compare cars based solely on the asking price and official fuel consumption, overlooking multi-year depreciation and mileage-triggered maintenance expenses.`,
          `Our goal is to put practical cost calculators, common powertrain maintenance checklists, and OBD-II fault code repair estimates in one place—with no sign-up, no paywalls, and full transparency about how our numbers are estimated.`,
        ],
      },
      {
        heading: '2. Data Sources, Actuarial Depreciation Curves & Wear Estimates',
        paragraphs: [
          `All figures shown on ${brandName} are statistical estimates rather than guaranteed workshop quotes. Our 5-year and 10-year Actuarial Depreciation Curves model vehicle value retention by vehicle segment and adjust for annual mileage relative to regional averages.`,
          `Our maintenance schedules and component risk windows are compiled from publicly available manufacturer service schedules, technical service bulletins (TSBs), OEM parts catalogs, and typical independent vs. franchised dealership labor rates. For stop-and-go city driving, our calculator applies a 1.35x to 1.55x wear multiplier to reflect the faster wear on engine oil, Diesel Particulate Filters (DPFs), and dual-mass flywheels during short cold-start trips.`,
        ],
      },
      {
        heading: '3. OBD-II Fault Code Lookup & US / UK / EU Regional Pricing',
        paragraphs: [
          `Each OBD-II trouble code guide in our lookup tool maps standard SAE J1979 fault codes to their most common mechanical or sensor causes, separating typical OE replacement part prices from estimated labor hours across three tiers: Franchised Dealership, Independent Specialist, and DIY Parts-Only.`,
          `Our unit converter switches currency ($ USD, £ GBP, € EUR), distance (miles and kilometers), and fuel/energy consumption (MPG US, MPG UK, L/100km, kWh/100mi, and kWh/100km) so drivers in the US, UK, and Europe can compare costs in their local units.`,
        ],
      },
      {
        heading: '4. Imprint (Impresszum) — Independent Operator Identification & Contact',
        paragraphs: [
          `${brandName} is operated as an independent digital publishing and web tool project (https://${domain}). To keep the calculators 100% free for all users, the site may include clearly labeled partner links (such as vehicle history report providers like carVertical or diagnostic tool retailers). Commercial links never alter our cost formulas or vehicle scores.`,
          `Operator & Publisher (Impresszum pursuant to EU Directive 2000/31/EC & Hungarian Act CVIII of 2001 on Electronic Commerce Services): DriveLedger Editorial & Development (${domain}) · Operating Jurisdiction: European Union / Hungary · Electronic Contact: ${contactEmail} · Legal, Privacy (GDPR/CCPA) & Editorial Inquiries: ${legalEmail} · Edge Hosting & CDN Infrastructure: Cloudflare, Inc.`,
        ],
      },
    ],
  },

  contact: {
    id: 'contact',
    hash: '#contact',
    shortLabel: 'Contact Us',
    title: `Contact ${brandName} — Editorial, Engineering & Legal Desk`,
    subtitle: `Direct Communication Channels for User Support, Data Corrections & Regulatory Inquiries — Last Updated: ${lastUpdated}`,
    lastUpdated,
    sections: [
      {
        heading: '1. General Support, Telemetry Feedback & Press Inquiries',
        paragraphs: [
          `We welcome feedback from vehicle owners, independent workshop technicians, and automotive journalists regarding our vehicle preset catalog, regional fuel/electricity defaults, and OBD-II repair dossiers.`,
          `General & Editorial Contact Email: ${contactEmail}`,
          `Official Platform Domain: https://${domain}`,
        ],
      },
      {
        heading: '2. Legal, Privacy (GDPR / UK GDPR / CCPA) & Compliance Desk',
        paragraphs: [
          `For formal inquiries regarding our Terms of Service, Nominative Fair Use Trademark Notice, FTC 16 CFR Part 255 Affiliate Disclosures, or statutory data subject requests under the EU/UK General Data Protection Regulation (GDPR Articles 12–23) and the California Consumer Privacy Act (CCPA/CPRA), please contact our legal compliance desk directly:`,
          `Legal & Privacy Compliance Email: ${legalEmail}`,
          `Target Response SLA: We acknowledge all verified legal and regulatory inquiries within 2 business days and fulfill statutory privacy requests well within applicable 30-day statutory windows.`,
        ],
      },
      {
        heading: '3. Reporting a Vehicle Preset or OBD-II Calibration Update',
        paragraphs: [
          `When submitting a workshop invoice benchmark or suggesting a new vehicle powertrain preset for inclusion in ${brandName}, please include the vehicle model year, engine code, physical odometer reading, region (US, UK, or EU), and whether the service was performed by a main dealership or an independent specialist.`,
        ],
      },
      {
        heading: '4. Statutory Imprint (Impresszum) & Service Provider Details',
        paragraphs: [
          `Service Provider & Editorial Operator: DriveLedger Editorial & Development (https://${domain}) · Jurisdiction: European Union / Hungary (in accordance with EU e-Commerce Directive 2000/31/EC and Hungarian Act CVIII of 2001).`,
          `Direct Electronic Contact: ${contactEmail} (General & Affiliate Partnerships) · ${legalEmail} (Legal, GDPR Data Protection & Copyright) · Infrastructure & Hosting Provider: Cloudflare, Inc. (101 Townsend St, San Francisco, CA 94107, USA / Cloudflare European Edge Network).`,
        ],
      },
    ],
  },
};

// Ensure key and clean path are attached to each policy object
Object.entries(LEGAL_POLICIES).forEach(([key, policy]) => {
  if (!policy.key) policy.key = key;
  if (!policy.path) policy.path = `/${key}`;
});

export default LEGAL_POLICIES;
