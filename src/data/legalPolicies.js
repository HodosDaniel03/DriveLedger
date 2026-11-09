/**
 * DriveLedger — Comprehensive Legal, Liability, Privacy & Regulatory Policy Suite
 * Dynamically bound to `src/config/monetizationConfig.js`.
 * Written in full, formal, multi-paragraph English legal prose with zero placeholders.
 */

import { MONETIZATION_CONFIG } from '../config/monetizationConfig';

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
  '#about',
  '#contact',
];

export const LEGAL_CLEAN_ROUTES = [
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
  '/affiliate-disclosure',
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
  '/about': 'about',
  '/contact': 'contact',
  // Bare keys
  privacy: 'privacy',
  terms: 'terms',
  disclaimer: 'disclaimer',
  'affiliate-disclosure': 'affiliate-disclosure',
  affiliate: 'affiliate-disclosure',
  cookies: 'cookies',
  about: 'about',
  contact: 'contact',
  // Hash routes
  '#privacy': 'privacy',
  '#terms': 'terms',
  '#disclaimer': 'disclaimer',
  '#affiliate-disclosure': 'affiliate-disclosure',
  '#affiliate': 'affiliate-disclosure',
  '#cookies': 'cookies',
  '#about': 'about',
  '#methodology': 'about',
  '#contact': 'contact',
};

export function resolveLegalPolicyKey(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const cleaned = rawInput.trim().toLowerCase();

  // Collision guard: /methodology is an application workspace tab, NOT the 'about' modal
  if (
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
    title: 'Privacy Policy & Telemetry Data Governance (GDPR, UK GDPR & CCPA Compliant)',
    subtitle: `Client-Side Data Architecture, Google AdSense DART Disclosures & Statutory Consumer Privacy Rights — Last Updated: ${lastUpdated}`,
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
        heading: '2. Verbatim Google AdSense & DoubleClick DART Cookie Disclosure',
        paragraphs: [
          ADSENSE_DART_COOKIE_CLAUSE,
          `When personalized or non-personalized advertising is active on https://${domain}, Google and its certified AdSense vendor partners may automatically receive your IP address, browser user-agent string, coarse geographic region, and page URL in order to deliver contextually relevant advertisements, cap ad frequency, and detect invalid traffic or click fraud. You may review Google's official Partner Sites Privacy Policy at https://policies.google.com/technologies/partner-sites.`,
        ],
      },
      {
        heading: '3. Outbound Affiliate Links & Third-Party Merchant Privacy',
        paragraphs: [
          `Our calculators contain contextual partner links to third-party automotive platforms (such as VIN history registries, diagnostic hardware retailers, OEM parts catalogs, and insurance comparison marketplaces). When you voluntarily click an outbound partner link, your browser navigates to that third-party domain with a standard referral tracking parameter. ${brandName} does not receive any personal identity, payment card, or VIN query data that you subsequently submit on a third-party partner website; such interactions are governed solely by the privacy policy of the destination merchant.`,
        ],
      },
      {
        heading: '4. EEA & UK GDPR Statutory Rights (Articles 12–23)',
        paragraphs: [
          `If you access https://${domain} from the European Economic Area (EEA), the United Kingdom, or Switzerland, you are entitled to comprehensive statutory rights under Regulation (EU) 2016/679 (GDPR) and the UK Data Protection Act 2018. Specifically, you hold: (a) the Right to Transparent Information (Articles 12–14); (b) the Right of Subject Access (Article 15); (c) the Right to Rectification (Article 16); (d) the Right to Erasure / "Right to be Forgotten" (Article 17); (e) the Right to Restriction of Processing (Article 18); (f) the Right to Data Portability (Article 20); (g) the Right to Object to Processing based on legitimate interests or direct marketing (Article 21); and (h) the Right not to be subject to Automated Individual Decision-Making (Article 22).`,
          `Where we rely upon your consent for non-essential analytics or personalized advertising cookies under GDPR Article 6(1)(a), you have the absolute right to withdraw your consent at any time via the "Cookie Preferences" control in our site footer without affecting the lawfulness of processing prior to withdrawal. For all GDPR data protection inquiries, contact our Data Protection Desk at ${legalEmail} or ${contactEmail}.`,
        ],
      },
      {
        heading: '5. California CCPA / CPRA Rights ("Do Not Sell or Share My Personal Information")',
        paragraphs: [
          `Under the California Consumer Privacy Act of 2018 (CCPA) as amended by the California Privacy Rights Act of 2020 (CPRA, California Civil Code § 1798.100 et seq.), California residents hold: (a) the Right to Know what categories and specific pieces of personal information are collected, used, or disclosed; (b) the Right to Delete personal information; (c) the Right to Correct inaccurate personal information; (d) the Right to Opt-Out of the "Sale" or "Sharing" of personal information for cross-context behavioral advertising; and (e) the Right to Non-Discrimination for exercising any CCPA/CPRA privacy right.`,
          `${brandName} does not sell personal information for monetary consideration. To opt out of third-party cross-context behavioral advertising cookies ("Do Not Sell or Share My Personal Information"), click "Cookie Preferences" in the website footer and select "Essential Only", or submit a formal request to ${legalEmail}.`,
        ],
      },
    ],
  },

  cookies: {
    id: 'cookies',
    hash: '#cookies',
    shortLabel: 'Cookie Policy',
    title: 'GDPR / CCPA Cookie & Local Storage Governance Policy',
    subtitle: `Granular Breakdown of First-Party Browser Storage, Google AdSense DART Cookies & Opt-Out Controls — Last Updated: ${lastUpdated}`,
    lastUpdated,
    sections: [
      {
        heading: '1. How We Use Local Storage and Cookies',
        paragraphs: [
          `${brandName} (https://${domain}) utilizes strictly necessary HTML5 Local Storage keys to preserve your user-interface state across page reloads, alongside optional third-party advertising cookies that are controlled by your explicit consent preferences.`,
          `Essential First-Party Local Storage Keys include: "shiftmetric_theme" (persists Light or Dark display mode), "shiftmetric_unit_region" (persists US, UK, or EU currency and measurement units), "shiftmetric_garage_v1" (stores your locally bookmarked vehicle presets on your device), and "shiftmetric_cookie_consent" (records your GDPR/CCPA privacy banner selection). These essential keys never leave your browser and do not track you across external websites.`,
        ],
      },
      {
        heading: '2. Advertising & Google DoubleClick DART Cookies',
        paragraphs: [
          ADSENSE_DART_COOKIE_CLAUSE,
          `If you select "Essential Only" in our Cookie Consent Banner or Cookie Preferences modal, ${brandName} records your rejection of personalized tracking in localStorage and restricts optional third-party behavioral profiling scripts.`,
        ],
      },
      {
        heading: '3. Managing & Revoking Your Cookie Preferences',
        paragraphs: [
          `You can modify or revoke your consent at any time using the interactive controls below or by clicking the permanent "Cookie Preferences" button in our global footer. Additionally, you may clear cookies and site data directly through your browser settings (Chrome, Safari, Firefox, or Edge) or manage industry-wide ad preferences via https://myadcenter.google.com/, https://www.aboutads.info/choices/, and https://www.youronlinechoices.eu/.`,
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
