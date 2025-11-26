// scripts/seedMenuData.js
require('dotenv').config();
const mongoose = require('mongoose');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/forlandservice')
  .then(() => {
    console.log('Connected to MongoDB');
    seedMenuData();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

async function seedMenuData() {
  try {
    // Clear existing data
    await MenuCategory.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu data');

    // Define menu categories with subcategories
    const menuCategoriesData = [
      {
        name: 'personal',
        displayName: 'Personal',
        position: 1,
        isActive: true,
        subcategories: [
          { name: 'Transactional Account', displayName: 'Transactional Account', position: 1, route: '/Transactional-Account', bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png', isActive: true },
          { name: 'Saving Account', displayName: 'Saving Account', position: 2, route: '/Saving-Account', bannerImage: '/assets/images/backgrounds/Saving-Account-Banner.png', isActive: true },
          { name: 'Loan Account', displayName: 'Loan Account', position: 3, route: '/Loan-Account', bannerImage: '/assets/images/backgrounds/Loan-Account-Banner.png', isActive: true },
        ],
      },
      {
        name: 'invest',
        displayName: 'Invest',
        position: 2,
        isActive: true,
        bannerImage: '/assets/images/backgrounds/Invest-Banner.png',
        subcategories: [],
      },
      {
        name: 'business',
        displayName: 'Business',
        position: 3,
        isActive: true,
        subcategories: [
          { name: 'Account', displayName: 'Account', position: 1, route: '/Account', bannerImage: '/assets/images/backgrounds/Business-Account-Banner.png', isActive: true },
          { name: 'Loans', displayName: 'Loans', position: 2, route: '/Loans', bannerImage: '/assets/images/backgrounds/Business-Loans-Banner.png', isActive: true },
          { name: 'Ways To Bank', displayName: 'Ways To Bank', position: 3, route: '/Ways-To-Bank', bannerImage: '/assets/images/backgrounds/Ways-To-Bank-Banner.png', isActive: true },
        ],
      },
      {
        name: 'bancassurance',
        displayName: 'Bancassurance',
        position: 4,
        isActive: true,
        subcategories: [
          { name: 'Non-Life Insurance', displayName: 'Non-Life Insurance', position: 1, route: '/Non-Life-Insurance', bannerImage: '/assets/images/backgrounds/Non-Life-Insurance-Banner.png', isActive: true },
          { name: 'Life Insurance', displayName: 'Life Insurance', position: 2, route: '/Life-Insurance', bannerImage: '/assets/images/backgrounds/Life-Insurance-Banner.png', isActive: true },
        ],
      },
    ];

    // Create menu categories
    const createdCategories = await MenuCategory.insertMany(menuCategoriesData);
    console.log('Created menu categories');

    // Define menu items with page content
    const menuItemsData = [
      // Personal - Transactional Account
      {
        menuCategory: 'personal',
        subcategory: 'Transactional Account',
        route: '/Transactional-Account',
        name: 'Personal Current',
        position: 1,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Transactional Account',
          breadcrumbSubTitle: 'Personal Current',
          title: 'Personal Current Account',
          description: 'For individuals salaried and self-employed in need of cheque books for convenient bill payments.',
          features: [
            { text: '24HRS ATM Accessibility' },
            { text: 'Access to Cheque Book' },
            { text: 'Allows Salary Credit' },
            { text: 'No Credit' },
            { text: 'Access to Mobile Banking' },
          ],
          benefits: [
            { text: 'Access to overdraft on demand' },
            { text: 'Make payments by cheques' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Transactional Account',
        route: '/Transactional-Account',
        name: 'Foreign Currency Current',
        position: 2,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Transactional Account',
          breadcrumbSubTitle: 'Foreign Currency Current',
          title: 'Foreign Currency Current Account',
          description: 'For individuals looking for affordable transactional foreign currency account. Cheque book is issued to US$ accounts only.',
          features: [
            { text: 'No ATM cards' },
            { text: 'Cheque Book – US$ 0.3 per leaf' },
            { text: 'Allows Salary Credit' },
          ],
          benefits: [
            { text: 'Gets an advantage of receiving foreign currency and save directly without losing on exchange rates.' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Transactional Account',
        route: '/Transactional-Account',
        name: 'Mwalimu Transactional',
        position: 3,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Transactional Account',
          breadcrumbSubTitle: 'Mwalimu Transactional',
          title: 'Mwalimu Transactional Account',
          description: 'Account specifically designed with low cost in order to attract salaries and deposits from different sectors.',
          features: [
            { text: 'Monthly Fee – FEE' },
            { text: '24HRS ATM Access' },
          ],
          benefits: [
            { text: 'Mobile Banking – Allowed' },
            { text: 'Receives Salary Credit' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Transactional Account',
        route: '/Transactional-Account',
        name: 'Career Account',
        position: 4,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Transactional Account',
          breadcrumbSubTitle: 'Career Account',
          title: 'Career Account',
          description: 'For individuals looking for affordable transactional foreign currency account. Cheque book is issued to US$ accounts only.',
          features: [
            { text: 'No ATM cards' },
            { text: 'Cheque Book – US$ 0.3 per leaf' },
            { text: 'Allows Salary Credit' },
          ],
          benefits: [
            { text: 'Gets an advantage of receiving foreign currency and save directly without losing on exchange rates.' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      // Personal - Saving Account (sample entries)
      {
        menuCategory: 'personal',
        subcategory: 'Saving Account',
        route: '/Saving-Account',
        name: 'Tukutane January',
        position: 1,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Saving Account',
          breadcrumbSubTitle: 'Tukutane January',
          title: 'Tukutane January',
          description: 'A savings account designed for your financial goals.',
          features: [
            { text: 'Competitive interest rates' },
            { text: 'Easy access to funds' },
          ],
          benefits: [
            { text: 'Save for your future' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Saving Account',
        route: '/Saving-Account',
        name: 'Akiba Yangu',
        position: 2,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Saving Account',
          breadcrumbSubTitle: 'Akiba Yangu',
          title: 'Akiba Yangu',
          description: 'A savings account designed for your financial goals.',
          features: [
            { text: 'Competitive interest rates' },
            { text: 'Easy access to funds' },
          ],
          benefits: [
            { text: 'Save for your future' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Saving Account',
        route: '/Saving-Account',
        name: 'Child Saving',
        position: 3,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Saving Account',
          breadcrumbSubTitle: 'Child Saving',
          title: 'Child Saving',
          description: 'A savings account designed for your financial goals.',
          features: [
            { text: 'Competitive interest rates' },
            { text: 'Easy access to funds' },
          ],
          benefits: [
            { text: 'Save for your future' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Saving Account',
        route: '/Saving-Account',
        name: 'Foreign Current Savings',
        position: 4,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Saving Account',
          breadcrumbSubTitle: 'Foreign Current Savings',
          title: 'Foreign Current Savings',
          description: 'A savings account designed for your financial goals.',
          features: [
            { text: 'Competitive interest rates' },
            { text: 'Easy access to funds' },
          ],
          benefits: [
            { text: 'Save for your future' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Saving Account',
        route: '/Saving-Account',
        name: 'Student Account',
        position: 5,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Saving Account',
          breadcrumbSubTitle: 'Student Account',
          title: 'Student Account',
          description: 'A savings account designed for your financial goals.',
          features: [
            { text: 'Competitive interest rates' },
            { text: 'Easy access to funds' },
          ],
          benefits: [
            { text: 'Save for your future' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Saving Account',
        route: '/Saving-Account',
        name: 'Tunu Account',
        position: 6,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Saving Account',
          breadcrumbSubTitle: 'Tunu Account',
          title: 'Tunu Account',
          description: 'A savings account designed for your financial goals.',
          features: [
            { text: 'Competitive interest rates' },
            { text: 'Easy access to funds' },
          ],
          benefits: [
            { text: 'Save for your future' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      // Personal - Loan Account (sample entries)
      {
        menuCategory: 'personal',
        subcategory: 'Loan Account',
        route: '/Loan-Account',
        name: 'Mwalimu Personal Loan',
        position: 1,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Loan Account',
          breadcrumbSubTitle: 'Mwalimu Personal Loan',
          title: 'Mwalimu Personal Loan',
          description: 'It is a salaried Loan targeting Teachers from Government schools. Mostly for development purposes but can also cater for short term needs such as school fees, personal development, and any other legal need.',
          features: [
            { text: 'Minimum Period 3 months' },
            { text: 'Maximum period 86 months based on amounts and ability to pay' },
            { text: 'Maximum unsecured amounts up to Tshs.30,000,000/=' },
            { text: 'Maximum secured amount up to Tshs.70,000,000/=' },
          ],
          benefits: [
            { text: 'Longer repayment period, smaller monthly payments' },
            { text: 'Credit life insurance cover against death and permanent disability' },
            { text: 'No hassles to get loan' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Loan Account',
        route: '/Loan-Account',
        name: 'Personal Loan',
        position: 2,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Loan Account',
          breadcrumbSubTitle: 'Personal Loan',
          title: 'Personal Loan',
          description: 'Salaried loan targeting Government employees. Mostly for development purposes or short-term needs.',
          features: [
            { text: 'Minimum Period 3 months' },
            { text: 'Maximum period 86 months based on amounts and ability to pay' },
            { text: 'Maximum unsecured amounts up to Tshs.30,000,000/=' },
            { text: 'Maximum secured amount up to Tshs.70,000,000/=' },
          ],
          benefits: [
            { text: 'Longer repayment period, smaller monthly payments' },
            { text: 'Credit life insurance cover against death and permanent disability' },
            { text: 'No hassles to get loan' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      {
        menuCategory: 'personal',
        subcategory: 'Loan Account',
        route: '/Loan-Account',
        name: 'Salary Advance',
        position: 3,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Loan Account',
          breadcrumbSubTitle: 'Salary Advance',
          title: 'Salary Advance',
          description: 'Salaried loan for Government employees for emergency purposes or short-term needs.',
          features: [
            { text: 'Must have salary account with MCB where salary should PASS at least ONCE' },
            { text: 'Maximum loan amount is 50% of net salary' },
            { text: 'Maximum repayment period = 1 month' },
          ],
          benefits: [
            { text: '0% Loan Application Fee' },
            { text: '0% Life insurance' },
            { text: 'No collateral/security required' },
            { text: 'Only salary passing through Mwalimu bank needed' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
      // Add more loan items (simplified for brevity)
      {
        menuCategory: 'personal',
        subcategory: 'Loan Account',
        route: '/Loan-Account',
        name: 'Wastaafu Loan',
        position: 4,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Loan Account',
          breadcrumbSubTitle: 'Wastaafu Loan',
          title: 'Wastaafu Loan',
          description: 'Special loan for government retirees who channel their pension at Mwalimu bank.',
          features: [
            { text: 'Min period = 3 months' },
            { text: 'Maximum period = 60 months based on amount and ability to pay' },
            { text: 'Minimum loan TZS 300,000/=' },
            { text: 'Maximum unsecured up to TZS 30,000,000/= for pensioners routing via Mwalimu bank' },
            { text: 'Maximum secured up to 80% of amount fixed as cash cover' },
          ],
          benefits: [
            { text: 'Lower interest rate' },
            { text: 'Credit life insurance cover up to age 70' },
            { text: 'Loan access and free consultation from bank professionals' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      },
    ];

    // Add remaining loan items with basic structure
    ['Insurance Premium Finance', 'Global Education Loan', 'Mchongo Fasta', 'Jenga na Mwalimu Bank', 'Plot Loan', 'Mlinde Mstaafu', 'Ada Chap Chap', 'Mwalimu Jikimu'].forEach((name, index) => {
      menuItemsData.push({
        menuCategory: 'personal',
        subcategory: 'Loan Account',
        route: '/Loan-Account',
        name: name,
        position: 5 + index,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Loan Account',
          breadcrumbSubTitle: name,
          title: name,
          description: `Details for ${name}.`,
          features: [
            { text: 'Feature 1' },
            { text: 'Feature 2' },
          ],
          benefits: [
            { text: 'Benefit 1' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      });
    });

    // Invest items - Each item can have its own banner image
    const investItems = [
      { name: 'Instant Income/Upfront', bannerImage: '/assets/images/backgrounds/Invest-Banner.png' },
      { name: 'Semi Fixed/Flexible', bannerImage: '/assets/images/backgrounds/Invest-Banner.png' },
      { name: 'Regular Interest Payment', bannerImage: '/assets/images/backgrounds/Invest-Banner.png' },
      { name: 'Call Account', bannerImage: '/assets/images/backgrounds/Invest-Banner.png' },
      { name: 'Traditional (US$/E/EUR)', bannerImage: '/assets/images/backgrounds/Invest-Banner.png' },
    ];
    
    investItems.forEach((item, index) => {
      menuItemsData.push({
        menuCategory: 'invest',
        subcategory: 'Invest',
        route: '/Invest',
        name: item.name,
        position: index + 1,
        isActive: true,
        pageContent: {
          bannerImage: item.bannerImage,
          breadcrumbTitle: 'Invest',
          breadcrumbSubTitle: item.name,
          title: item.name,
          description: `Investment option: ${item.name}.`,
          features: [
            { text: 'Feature 1' },
            { text: 'Feature 2' },
          ],
          benefits: [
            { text: 'Benefit 1' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      });
    });

    // Right issue - Invest category
    menuItemsData.push({
      menuCategory: 'invest',
      subcategory: 'Invest',
      route: '/Invest',
      name: 'Right issue',
      position: 6,
      isActive: true,
      pageContent: {
        bannerImage: '/assets/images/backgrounds/Invest-Banner.png',
        breadcrumbTitle: 'Invest',
        breadcrumbSubTitle: 'Right issue',
        title: 'Right issue',
        description: 'Rights Issue information for Mwalimu Commercial Bank PLC shareholders.',
        features: [],
        benefits: [],
        accordionItems: [
          {
            title: 'Rights Issue Summary (English Version)',
            content: `<p>Mwalimu Commercial Bank PLC is looking to raise TZS 20,402,223,600 through a rights issue by issuing 185,474,760 new ordinary shares based on an entitlement ratio of 3:1 (i.e. 3 new shares for every 1 share held). This exercise will be open to eligible shareholders whose names are on the shareholder registry as of the record date, 21st November 2025. The offer period will open on 24 November 2025, and close on 19 December 2025, at 4PM.</p>

<h3>Why the Rights Issue?</h3>
<p>Having conducted its IPO in 2015, at an initial offer price of TZS 500 per share, the bank has gone through a difficult phase, which saw it make consecutive losses for the period 2015-2018. This effectively eroded the capital base of the bank, the foundation that allows the bank to grow its balance sheet. However, despite having sustained losses, the management team implemented a turnaround strategy from 2019 to 2024, which saw the bank become profitable in 2023, and subsequently in 2024. To sustain this momentum and grow further, the bank needs an adequate capital base, in line with the regulatory requirements by the Bank of Tanzania, to allow itself to grow its balance sheet further, and propel its profitability.</p>

<h3>Use of Proceeds for the Rights Issue</h3>
<p>The Rights Issue is being undertaken subsequent to a resolution made by MCB's Board of Directors and approved at the Annual General Meeting held on 19th June 2025 to increase the share capital of the Bank.</p>
<p>The proceeds from the rights issue will be used to:</p>
<ul>
  <li>Raise a significant level of equity capital to fund the bank at the lowest cost of capital and ensure compliance with the BOT capital adequacy requirements.</li>
  <li>Grow the balance sheet of the bank.</li>
  <li>Support the bank's Medium-Term Plan (MTP) for the period 2026-2030.</li>
  <li>Afford the bank's capital investment in ICT infrastructure.</li>
</ul>`,
            position: 1,
          },
          {
            title: 'Rights Issue Summary (Swahili Version)',
            content: `<p>MCB inatoa jumla ya Hisa Mpya za kawaida 185,474,760 kwa bei ya Shilingi 110 kwa kila Hisa Mpya ya Kawaida, kwa lengo la kukusanya jumla ya Shilingi 20,402,223,600 (kabla ya gharama) kupitia zoezi la Hisa Stahiki uliowekwa katika Dokezo hili, kwa misingi ya Uwiano wa Haki (Entitlement Ratio), ambapo Hisa Mpya za Kawaida tatu (3) zinatolewa kwa kila Hisa ya Kawaida moja (1) inayomilikiwa na Mwanahisa Mstahiki kufikia tarehe ya Kumbukumbu, 21 Novemba 2025. Muda wa toleo utafunguka 24 Novemba 2025, na kufungwa tarehe 19 Desemba 2025, saa 10 alasiri.</p>

<h3>Kwa nini MCB inafanya utoaji wa hisa stahiki?</h3>
<p>MCB inafanya utoaji wa haki za hisa ili kukusanya mtaji wa ziada ambao utaimarisha mtaji wa benki. Baada ya kufanya IPO yake mwaka 2015, kwa bei ya awali ya toleo ya TZS 500 kwa kila hisa, benki imepitia kipindi ngumu, ambacho kilisababisha hasara zinazofuata kwa kipindi cha 2015-2018. Hii iliharibu msingi wa mtaji wa benki, ambapo ndio msingi unaoruhusu benki kukua orodha yake ya msimamo wa fedha. Hata hivyo, licha ya kuwa na hasara zilizoendelea, timu ya usimamizi ilitekeleza mkakati wa kugeuza hali kutoka 2019 hadi 2024, ambao ulifanya benki iwe na faida mwaka 2023, na kwa ujumla mwaka 2024. Ili kudumisha kasi hii na kukua zaidi, benki inahitaji kuimarisha mtaji, kulingana na mahitaji ya udhibiti ya Benki ya Tanzania, ili kuruhusu kukua zaidi orodha yake ya msimamo wa fedha, na kukuza faida yake.</p>

<h3>Lengo la Hisa Stahiki</h3>
<p>Utoaji wa Haki za Hisa unafanywa kufuatia azimio lililotolewa na Bodi ya Wakurugenzi wa MCB na kupitishwa katika Mkutano Mkuu wa Kila Mwaka uliofanyika tarehe 19 Juni 2025 ili kuongeza mtaji wa hisawa Benki. Mapato kutokana na zoezi hili yatatumika:</p>
<ul>
  <li>Kuongeza kiwango kikubwa cha mtaji wa hisa ili kufadhili benki kwa gharama ya chini zaidi ya mtaji na kuhakikisha benki ina mtaji wa kutosha kulingana na vigezo vya BOT.</li>
  <li>Kukuza mizania ya benki.</li>
  <li>Kusaidia kufanikisha Mpango Mkakati mpya wa benki (MTP) kwa kipindi cha 2026-2030.</li>
  <li>Kufanikisha uwekezaji wa benki katika miundombinu ya Tehama.</li>
</ul>

<div style="margin-top: 40px; padding: 20px; background-color: #f5f5f5; border-radius: 8px; text-align: center;">
  <a href="https://ipo.itrust.tz/" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 30px; background-color: #e97927; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
    Visit IPO Portal
  </a>
</div>`,
            position: 2,
          },
        ],
        additionalContent: '',
      },
    });

    // Business - Account
    ['Corporate Current Account', 'Call Deposit Account', 'Club/NGO Current Account', 'Mtaji Business Account'].forEach((name, index) => {
      menuItemsData.push({
        menuCategory: 'business',
        subcategory: 'Account',
        route: '/Account',
        name: name,
        position: index + 1,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Account',
          breadcrumbSubTitle: name,
          title: name,
          description: `Business account: ${name}.`,
          features: [
            { text: 'Feature 1' },
            { text: 'Feature 2' },
          ],
          benefits: [
            { text: 'Benefit 1' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      });
    });

    // Business - Loans
    ['MSME Business Loan', 'Business Overdraft', 'Bank Guarantees'].forEach((name, index) => {
      menuItemsData.push({
        menuCategory: 'business',
        subcategory: 'Loans',
        route: '/Loans',
        name: name,
        position: index + 1,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Loans',
          breadcrumbSubTitle: name,
          title: name,
          description: `Business loan: ${name}.`,
          features: [
            { text: 'Feature 1' },
            { text: 'Feature 2' },
          ],
          benefits: [
            { text: 'Benefit 1' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      });
    });

    // Business - Ways To Bank
    ['Mwalimu Mobile', 'Mwalimu Wakala', 'MwalimuCard Visa', 'Privacy Policy'].forEach((name, index) => {
      menuItemsData.push({
        menuCategory: 'business',
        subcategory: 'Ways To Bank',
        route: '/Ways-To-Bank',
        name: name,
        position: index + 1,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Ways To Bank',
          breadcrumbSubTitle: name,
          title: name,
          description: `Ways to bank: ${name}.`,
          features: [
            { text: 'Feature 1' },
            { text: 'Feature 2' },
          ],
          benefits: [
            { text: 'Benefit 1' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      });
    });

    // Bancassurance - Non-Life Insurance
    ['Fire & Allied Perils Insurance', 'Liability Insurance', 'Motor Insurance', 'Marine Insurance', 'Engineering Insurance', 'Agriculture Insurance', 'Insurance Premium Finance'].forEach((name, index) => {
      menuItemsData.push({
        menuCategory: 'bancassurance',
        subcategory: 'Non-Life Insurance',
        route: '/Non-Life-Insurance',
        name: name,
        position: index + 1,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Non-Life Insurance',
          breadcrumbSubTitle: name,
          title: name,
          description: `Non-life insurance: ${name}.`,
          features: [
            { text: 'Feature 1' },
            { text: 'Feature 2' },
          ],
          benefits: [
            { text: 'Benefit 1' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      });
    });

    // Bancassurance - Life Insurance
    ['Kikundi Chetu Faraja Yetu', 'Binafsi', 'Individual Life Insurance'].forEach((name, index) => {
      menuItemsData.push({
        menuCategory: 'bancassurance',
        subcategory: 'Life Insurance',
        route: '/Life-Insurance',
        name: name,
        position: index + 1,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Life Insurance',
          breadcrumbSubTitle: name,
          title: name,
          description: `Life insurance: ${name}.`,
          features: [
            { text: 'Feature 1' },
            { text: 'Feature 2' },
          ],
          benefits: [
            { text: 'Benefit 1' },
          ],
          accordionItems: [],
          additionalContent: '',
        },
      });
    });

    // Create menu items
    await MenuItem.insertMany(menuItemsData);
    console.log('Created menu items');

    console.log('✅ Menu data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding menu data:', error);
    process.exit(1);
  }
}

