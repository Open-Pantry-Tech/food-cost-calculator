# Chrome Web Store listing

Everything to paste into the Chrome Web Store Developer Dashboard for the Food Cost Calculator extension.

## Package

- Upload: `food-cost-calculator-extension.zip` (manifest at the zip root)
- Version: 1.0.0, Manifest V3
- Permissions: `storage` only. No host permissions, no content scripts, no remote code.

## Store listing tab

**Name** (44 / 75 chars)

```
Food Cost Calculator – Recipe & Menu Costing
```

**Short description / summary** (121 / 132 chars; this is also the manifest `description`)

```
Food cost calculator for restaurants and cafes: cost a recipe with yield, get plate cost, food cost %, GP and menu price.
```

**Category:** Productivity → Tools (alternative: Workflow & Planning)

**Language:** English (Australia)

**Full description**

```
A free food cost calculator in your browser toolbar. Cost a recipe line by line, see the plate cost and food cost percentage, and find the menu price that hits your target food cost. Built by Open Pantry for restaurants, cafes, pubs, caterers and food trucks.

HOW IT WORKS
Enter the dish name, the menu price and your target food cost. Then add each ingredient with the price and size of the pack you buy and how much the recipe uses. The calculator converts the units for you and works out:

• Line cost for each ingredient, including yield (trim and cooking loss)
• Plate cost
• Food cost percentage
• Gross profit per plate and GP %
• Menu price at your target food cost, including GST
• A clear status: on target, over target or well under target

THE FOOD COST FORMULA
Food cost % = plate cost ÷ menu price excluding GST × 100.
Line cost = pack price ÷ pack size × quantity used ÷ yield.
Menu price at target = plate cost ÷ target food cost × 1.1 (to add 10% GST back).

Most Australian restaurants and cafes aim for a food cost of 28–32% across the menu. Single dishes spread wider, which is fine as long as the blended figure across what you sell stays on target.

MADE FOR AUSTRALIAN KITCHENS, USEFUL ANYWHERE
• Menu prices including 10% GST by default, or switch to "no tax in the menu price"
• Units: kg, g, L, ml, each and dozen, plus lb, oz, gal, qt and fl oz
• Weight and volume are never mixed up: if a line uses litres for the pack and grams for the recipe, it is flagged instead of costed wrongly
• Add and remove as many ingredient rows as you need
• A worked example (chicken schnitzel, chips & salad) to start from

PRIVATE BY DESIGN
• Your current dish is saved on your own device with Chrome storage, so it is still there next time you open the calculator
• No account, no sign-in, no analytics, no tracking and no network requests
• Works offline

COSTING A WHOLE MENU?
This extension costs one dish at a time. Menu Profit Manager from Open Pantry reads your supplier invoices, keeps every ingredient price current and recalculates every dish when a price moves. You can also use the full online food cost calculator and download a free recipe costing template for Excel and Google Sheets at theopenpantry.com/food-cost-calculator.

ABOUT OPEN PANTRY
Open Pantry is a B2B food ordering and operations platform connecting wholesale suppliers with restaurants, cafes and venues.

The calculation code is open source under the MIT licence.
```

**Graphic assets**

| Asset | File | Size |
| --- | --- | --- |
| Store icon | `icons/icon-128.png` | 128 × 128 |
| Screenshot | `store/screenshot-1280x800.png` | 1280 × 800 |
| Small promo tile | `store/promo-small-440x280.png` | 440 × 280 |

Re-render with `node tools/render.js` and redraw icons with `python3 tools/make_icons.py`.

**Official URL / homepage:** https://www.theopenpantry.com/food-cost-calculator
**Support URL:** https://www.theopenpantry.com/contact-us

## Privacy practices tab

**Single purpose description**

```
Calculates the food cost of a single dish: the user enters a menu price, a target food cost and the ingredients with their pack prices, pack sizes, quantities and yields, and the popup shows plate cost, food cost percentage, gross profit and the menu price that hits the target.
```

**Permission justification: storage**

```
Used only to save the dish the user is currently costing (dish name, menu price, tax setting, target and ingredient rows) in chrome.storage.local on the user's own device, so the calculator reopens with the same dish. Nothing is synced or sent anywhere.
```

**Remote code:** No, I am not using remote code. All JavaScript is packaged in the extension; there are no external scripts, fonts, iframes or network requests.

**Data usage** (what user data is collected): tick none of the boxes.

| Category | Collected? |
| --- | --- |
| Personally identifiable information | No |
| Health information | No |
| Financial and payment information | No |
| Authentication information | No |
| Personal communications | No |
| Location | No |
| Web history | No |
| User activity | No |
| Website content | No |

Certifications (tick all three):

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** host the text below (for example at https://www.theopenpantry.com/food-cost-calculator-extension-privacy) or link the general policy at https://www.theopenpantry.com/privacy if it covers the extension.

## Privacy policy text

```
Food Cost Calculator – Recipe & Menu Costing: Privacy Policy
Last updated: 9 November 2026

This policy covers the "Food Cost Calculator – Recipe & Menu Costing" extension for Google Chrome, published by Open Pantry.

What the extension collects
Nothing. The extension does not collect, transmit, sell or share any personal or usage data. It has no analytics, no advertising, no tracking and no account or sign-in.

What the extension stores
The dish you are costing (dish name, menu price, tax setting, target food cost and the ingredient rows you enter) is saved with Chrome's local extension storage (chrome.storage.local) on your own device, so the calculator reopens with the same dish. This data never leaves your device and is not synced to your Google account. Removing the extension deletes it.

Network access
The extension makes no network requests. All of its code is packaged with it. It uses only the "storage" permission and cannot read or change the websites you visit.

Links
The popup contains links to theopenpantry.com. They open in a normal browser tab only when you click them, and that website is covered by the Open Pantry privacy policy at https://www.theopenpantry.com/privacy.

Changes
If this policy changes, the updated version will be published at this address with a new date.

Contact
Open Pantry, info@theopenpantry.com
```
