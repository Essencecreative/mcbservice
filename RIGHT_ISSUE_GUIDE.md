# Adding "Right Issue" Section to Menu Items - Guide

## ✅ System Verification

The system **fully supports** adding the "Right Issue" content dynamically through the dashboard:

- ✅ **Backend**: MenuItem model has `accordionItems` field that supports HTML content
- ✅ **Frontend**: MenuItemForm has accordion items UI with rich text editor
- ✅ **Rendering**: Dynamic pages render accordion items automatically
- ✅ **Links**: Rich text editor now supports adding links (enhanced)

## 📝 Step-by-Step Instructions

### Option 1: Create a New Menu Item for "Right Issue"

1. **Navigate to Dashboard**:
   - Go to `/menu-items` in the Forland Dashboard
   - Click "Create New" or navigate to `/menu-items/new`

2. **Fill in Basic Information**:
   - **Menu Category**: Select `invest`
   - **Subcategory**: Enter `Invest` (or create a new subcategory)
   - **Route**: Enter `/Invest` (or your preferred route)
   - **Name**: Enter `Right issue`
   - **Position**: Set appropriate position (e.g., 6)
   - **Is Active**: Check this box

3. **Page Content**:
   - **Breadcrumb Title**: `Invest`
   - **Breadcrumb Subtitle**: `Right issue`
   - **Title**: `Right issue`
   - **Description**: (Optional) Brief description

4. **Add Accordion Items**:
   Click "Add Accordion Item" and add the following:

   **Accordion Item 1:**
   - **Title**: `Rights Issue Summary (English Version)`
   - **Position**: `1`
   - **Content**: (Use the rich text editor or paste HTML below)

   **Accordion Item 2:**
   - **Title**: `Rights Issue Summary (Swahili Version)`
   - **Position**: `2`
   - **Content**: (Use the rich text editor or paste HTML below)

5. **Add the Link**:
   In the last accordion item's content, add the link at the end using the Link button in the editor, or paste this HTML:

   ```html
   <div style="margin-top: 40px; padding: 20px; background-color: #f5f5f5; border-radius: 8px; text-align: center;">
     <a href="https://ipo.itrust.tz/" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 30px; background-color: #e97927; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
       Visit IPO Portal
     </a>
   </div>
   ```

6. **Save**: Click "Create Item"

### Option 2: Add to Existing Invest Menu Item

1. Go to `/menu-items` and find an existing invest menu item
2. Click "Edit"
3. Scroll to "Accordion Items" section
4. Click "Add Accordion Item"
5. Add the content as described above
6. Save

## 📄 Content Templates

### English Version Content (HTML)

```html
<p>Mwalimu Commercial Bank PLC is looking to raise TZS 20,402,223,600 through a rights issue by issuing 185,474,760 new ordinary shares based on an entitlement ratio of 3:1 (i.e. 3 new shares for every 1 share held). This exercise will be open to eligible shareholders whose names are on the shareholder registry as of the record date, 21st November 2025. The offer period will open on 24 November 2025, and close on 19 December 2025, at 4PM.</p>

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
</ul>
```

### Swahili Version Content (HTML)

```html
<p>MCB inatoa jumla ya Hisa Mpya za kawaida 185,474,760 kwa bei ya Shilingi 110 kwa kila Hisa Mpya ya Kawaida, kwa lengo la kukusanya jumla ya Shilingi 20,402,223,600 (kabla ya gharama) kupitia zoezi la Hisa Stahiki uliowekwa katika Dokezo hili, kwa misingi ya Uwiano wa Haki (Entitlement Ratio), ambapo Hisa Mpya za Kawaida tatu (3) zinatolewa kwa kila Hisa ya Kawaida moja (1) inayomilikiwa na Mwanahisa Mstahiki kufikia tarehe ya Kumbukumbu, 21 Novemba 2025. Muda wa toleo utafunguka 24 Novemba 2025, na kufungwa tarehe 19 Desemba 2025, saa 10 alasiri.</p>

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
</div>
```

## 🎯 How It Works

1. **Dashboard**: Admin adds content via Menu Items form
2. **Backend**: Content is stored in MongoDB with accordion items
3. **Frontend**: When users visit `/Invest?type=Right issue`, the dynamic page renders:
   - Sidebar navigation (if multiple items)
   - Accordion sections with the content
   - All HTML formatting and links are preserved

## ✨ Features

- ✅ Fully dynamic - no code changes needed
- ✅ Rich text editor with link support
- ✅ HTML content support
- ✅ Multiple accordion items
- ✅ Position ordering
- ✅ Active/inactive toggle
- ✅ Responsive design

## 🔗 Link to IPO Portal

The link `https://ipo.itrust.tz/` can be added:
- In accordion content (recommended)
- In "Additional Content" field
- Using the Link button in the rich text editor

---

**Note**: The system is already set up and ready to use. Just follow the steps above to add the "Right Issue" content!

