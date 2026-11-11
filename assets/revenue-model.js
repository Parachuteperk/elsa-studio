/* Public price facts used by the studio. Not a forecast and not a 2027 rate card. */
var REVENUE_MODEL = {
  sources: [
    { id: "elsa_services", url: "https://makeupandhairbyelsa.com/services/", note: "Elsa public services page, fetched 2026-11-10. Prices undated.", label: "VERIFIED_FACT" },
    { id: "elsa_classes", url: "https://makeupandhairbyelsa.com/makeup-and-hair-classes/", note: "Elsa public classes page, fetched 2026-11-10. Prices undated.", label: "VERIFIED_FACT" },
    { id: "elsa_faq", url: "https://makeupandhairbyelsa.com/faq/", note: "Elsa public FAQ, fetched 2026-11-10.", label: "VERIFIED_FACT" },
    { id: "elsa_home", url: "https://makeupandhairbyelsa.com/", note: "Elsa homepage service list, fetched 2026-11-10.", label: "VERIFIED_FACT" },
    { id: "paige_corp", url: "https://www.paigeanderson.com/event-makeup-artist-dallas/corporate-event-makeup/", note: "Paige Anderson, Dallas, corporate makeup from $125 a person. Page undated.", label: "SOURCED_EXTERNAL" },
    { id: "katy", url: "https://www.katyreddellbeauty.com/services-1", note: "Katy Reddell, Austin headquarters with a Dallas page, $125 an hour. Undated.", label: "SOURCED_EXTERNAL" },
    { id: "studiow", url: "https://studiowportraits.com/event-page/", note: "Studio W makeup station $600 half day and $1,000 full day. City not confirmed on the page.", label: "SOURCED_EXTERNAL" },
    { id: "farrell", url: "https://www.farrellsdaughter.com/brand-photography", note: "Farrell's Daughter, Dallas, makeup add-on $150 a person.", label: "SOURCED_EXTERNAL" },
    { id: "knot2026", url: "https://images.theknot.com/rules/2026/the-knot-real-weddings-study-data-read-out-2026.pdf", note: "The Knot Real Weddings Study 2026. National, 2025 weddings. 76% fell May–October.", label: "SOURCED_EXTERNAL" },
    { id: "irs_mileage", url: "https://www.irs.gov/tax-professionals/standard-mileage-rates", note: "IRS business mileage, 76 cents July–December 2026.", label: "SOURCED_EXTERNAL" },
    { id: "square", url: "https://squareup.com/us/en/pricing", note: "Square US pricing, fetched 2026-11-10.", label: "SOURCED_EXTERNAL" }
  ]
};
