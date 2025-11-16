require('dotenv').config();
const mongoose = require('mongoose');
const FAQ = require('../models/FAQ');

const faqsData = [
  {
    question: "Huduma za MCB zinapatikana wapi na wapi?",
    answer: `Kuna zaidi ya tawi ishirini tatu (23) katika mikoa ya Dar es Salaam na mikoa yenye matawi yaliyoko Milimani (Milimani Tower) pamoja na Samora (jengo la CHC). Pia tuna ofisi mikoa ya Morogoro, Mwanza, Mbeya, Arusha, Dodoma, Bukoba, Mtwara, na Kigoma. 
Wateja wanaweza kupata huduma kupitia njia mbadala za kidigitali zikiwemo:
- MwalimuMobile (*150*38#)
- MwalimuWakala
- MwalimuCard VISA (kwa kutoa pesa kupitia ATM nyingi ndani na nje ya nchi)
- Huduma za posta kupitia TPB Bank
- Huduma kupitia ofisi za Chama cha Walimu ngazi ya wilaya.`,
    position: 1,
  },
  {
    question: "Je, MCB iko chini ya Benki ya Posta?",
    answer: "Hapana. Mwalimu Commercial Bank ni benki huru iliyoanzishwa kwa ajili ya walimu na wananchi kwa ujumla, na haipo chini ya Benki ya Posta.",
    position: 2,
  },
  {
    question: "Ni jinsi gani mteja anaweza kufufua akaunti ambayo haijatumika kwa muda mrefu (dormant)?",
    answer: "Mteja anaweza kufufua akaunti iliyokuwa haijatumika kwa kutembelea tawi lolote la MCB au ofisi ya Mwalimu na kujaza fomu maalum ya uamsho wa akaunti, kisha akaunti yake itafufuliwa.",
    position: 3,
  },
  {
    question: "Je, nawezaje kupata fedha sehemu ambapo hakuna tawi la Benki ya Mwalimu?",
    answer: "Unaweza kutoa au kuweka fedha kupitia huduma za MwalimuMobile, wakala wa MwalimuWakala, au kutumia kadi ya MwalimuCard VISA kwenye ATM au POS zilizo karibu nawe.",
    position: 4,
  },
  {
    question: "Je, ninavyaje kuhamisha mshahara kutoka Benki moja kuja Benki ya Mwalimu?",
    answer: "Unaweza kuhamisha mshahara wako kwa kujaza fomu ya maombi ya uhamisho wa mshahara inayopatikana katika tawi la MCB au ofisi za Chama cha Walimu.",
    position: 5,
  },
  {
    question: "Je, mikutano ya wanahisa hufanyika lini?",
    answer: "Mikutano ya wanahisa hufanyika mara moja kwa mwaka (AGM), na taarifa hutolewa mapema kupitia vyombo vya habari na tovuti ya benki.",
    position: 6,
  },
  {
    question: "Tunawaje kupata taarifa ya lini mikutano hufanyika?",
    answer: "Taarifa za mikutano hutangazwa kupitia tovuti ya benki, barua pepe, na mitandao ya kijamii ya Mwalimu Bank kabla ya siku ya mkutano.",
    position: 7,
  },
  {
    question: "Je, ni taratibu gani za kufuata pindi Mwanahisa wa Benki ya Mwalimu anatakuza hisa zake?",
    answer: "Mwanahisa anatakiwa kuwasiliana na ofisi ya MCB kwa maelekezo kuhusu mauzo au uhamisho wa hisa. Fomu husika za mauzo zitatolewa na benki.",
    position: 8,
  },
  {
    question: "Je, naweza kununua hisa za Mwalimu Benki?",
    answer: "Ndiyo, unaweza kununua hisa wakati wowote kwa kufuata utaratibu rasmi wa benki kupitia ofisi za MCB au CWT.",
    position: 9,
  },
  {
    question: "Je, inachukua muda gani kupata akaunti namba baada ya kukamilisha mahitaji?",
    answer: "Akaunti hupatikana ndani ya siku moja (1) hadi tatu (3) baada ya nyaraka zote muhimu kukamilika.",
    position: 10,
  },
  {
    question: "Je, Mstafu anaweza kufungua akaunti Mwalimu Benki?",
    answer: "Ndiyo, wastaafu wote wanaruhusiwa kufungua akaunti katika Mwalimu Bank kwa masharti sawa na wateja wengine.",
    position: 11,
  },
  {
    question: "Je, mnapango wa kufungua matawi ya benki ya Mwalimu Mikoani?",
    answer: "Ndiyo, benki ina mpango wa kupanua huduma zake katika mikoa yote nchini kupitia matawi mapya na huduma za kidigitali.",
    position: 12,
  },
  {
    question: "Je, hii ni benki kwa ajili ya walimu tu?",
    answer: "Hapana, ingawa benki ilianzishwa kwa ajili ya walimu, huduma zake zinapatikana kwa Watanzania wote.",
    position: 13,
  },
  {
    question: "Je, ukifungua Akaunti ya Mwalimu Benki inawezekana kutoa pesa ndani ya benki ya posta?",
    answer: "Ndiyo, unaweza kutoa pesa kupitia huduma ya TPB Bank kwa utaratibu uliowekwa.",
    position: 14,
  },
  {
    question: "Je, nikiwa na ATM card ya Mwalimu Benki naweza kutoa pesa ATM ya CRDB au NMB?",
    answer: "Ndiyo, unaweza kutoa pesa katika ATM yoyote yenye alama ya VISA au UmojaSwitch.",
    position: 15,
  },
  {
    question: "Je, benki ya Mwalimu inanunua madeni ya benki na taasisi nyingine za kifedha?",
    answer: "Ndiyo, benki hutoa huduma ya kulipia madeni yaliyopo kwenye taasisi nyingine baada ya tathmini ya kifedha kufanywa.",
    position: 16,
  },
  {
    question: "Je, mna mpango gani wa kuhakikisha watu ambao hawajapata vyeti vya hisa tunaviapata?",
    answer: "Ndiyo, benki kwa kushirikiana na CWT inaendelea kutoa vyeti vya hisa kwa wanahisa wote waliokamilisha taratibu.",
    position: 17,
  },
  {
    question: "Wakati benki ilianzishwa tuliamriwa riba itakuwa single digit na sasa hivi ni 16%, kwanini imepanda kiasi hiki?",
    answer: "Mabadiliko ya riba hutegemea hali ya uchumi, viwango vya mfumuko wa bei, na gharama za uendeshaji wa huduma za kifedha nchini.",
    position: 18,
  },
  {
    question: "Toka benki ianzishwe imemfaidisha vipi mwalimu na hisa alizoweka?",
    answer: "Benki imetoa fursa za mikopo nafuu, gawio la faida, na huduma maalum kwa walimu tangu kuanzishwa kwake.",
    position: 19,
  },
  {
    question: "Benki imepata faida gani na mwalimu amefaidikaje?",
    answer: "Faida ya benki imewezesha kuboresha huduma, kuanzisha mikopo yenye riba nafuu, na kulipa gawio kwa wanahisa.",
    position: 20,
  },
  {
    question: "Kwa nini benki ili imeishia Dar ilihali walimu wapo nchi nzima?",
    answer: "Benki ipo kwenye mpango wa kupanua huduma nchi nzima kupitia matawi mapya, wakala na huduma za mtandaoni.",
    position: 21,
  },
  {
    question: "Nani mmiliki hasa wa benki hii kati ya Mwalimu na wanahisa wengine?",
    answer: "Wamiliki wakuu ni walimu kupitia Chama cha Walimu Tanzania (CWT), pamoja na wanahisa wengine binafsi.",
    position: 22,
  },
  {
    question: "Kwa wale tuliokuwa na hisa wenyewe na pia zingine kununuliwa na CWT kwa bahati mbaya hatujapewa vyeti vya hisa, je zitatolewa cheti kimoja?",
    answer: "Ndiyo, wanahisa watapewa cheti kimoja cha hisa kinachojumuisha hisa zote walizonazo.",
    position: 23,
  },
  {
    question: "Ni utaratibu gani utakao niwezesha kufulika soko la hisa kwa kuuza au kununua hisa za MCB nikiwa huko kijijini?",
    answer: "Utaratibu wa mtandao na wakala unaruhusu mauzo na ununuzi wa hisa kupitia ofisi za CWT au MCB mikoani.",
    position: 24,
  },
  {
    question: "Pamoja na kuwa hisa zinarithishwa/kukamishishwa, ni utaratibu gani unatumika ili kuhamishia hisa kwa mtu ninayetaka kumpa (hisa zote au kiasi)?",
    answer: "Warithi au wanahisa wanapaswa kujaza fomu ya uhamisho wa hisa inayopatikana MCB au ofisi za CWT na kuambatanisha nyaraka za kisheria.",
    position: 25,
  },
];

async function seedFAQs() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not defined in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log('Cleared existing FAQs');

    // Insert FAQs
    const insertedFAQs = await FAQ.insertMany(faqsData);
    console.log(`Successfully seeded ${insertedFAQs.length} FAQs`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    process.exit(1);
  }
}

seedFAQs();

