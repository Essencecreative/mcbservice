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
          { name: 'Transactional Account', displayName: 'Transactional Account', position: 1, route: '/Transactional-Account', isActive: true },
          { name: 'Saving Account', displayName: 'Saving Account', position: 2, route: '/Saving-Account', isActive: true },
          { name: 'Loan Account', displayName: 'Loan Account', position: 3, route: '/Loan-Account', isActive: true },
        ],
      },
      {
        name: 'invest',
        displayName: 'Invest',
        position: 2,
        isActive: true,
        subcategories: [],
      },
      {
        name: 'business',
        displayName: 'Business',
        position: 3,
        isActive: true,
        subcategories: [
          { name: 'Account', displayName: 'Account', position: 1, route: '/Account', isActive: true },
          { name: 'Loans', displayName: 'Loans', position: 2, route: '/Loans', isActive: true },
          { name: 'Ways To Bank', displayName: 'Ways To Bank', position: 3, route: '/Ways-To-Bank', isActive: true },
        ],
      },
      {
        name: 'bancassurance',
        displayName: 'Bancassurance',
        position: 4,
        isActive: true,
        subcategories: [
          { name: 'Non-Life Insurance', displayName: 'Non-Life Insurance', position: 1, route: '/Non-Life-Insurance', isActive: true },
          { name: 'Life Insurance', displayName: 'Life Insurance', position: 2, route: '/Life-Insurance', isActive: true },
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

    // Invest items
    ['Instant Income/Upfront', 'Semi Fixed/Flexible', 'Regular Interest Payment', 'Call Account', 'Traditional (US$/E/EUR)'].forEach((name, index) => {
      menuItemsData.push({
        menuCategory: 'invest',
        subcategory: 'Invest',
        route: '/Invest',
        name: name,
        position: index + 1,
        isActive: true,
        pageContent: {
          bannerImage: '/assets/images/backgrounds/Transactional-Account-Banner.png',
          breadcrumbTitle: 'Invest',
          breadcrumbSubTitle: name,
          title: name,
          description: `Investment option: ${name}.`,
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

