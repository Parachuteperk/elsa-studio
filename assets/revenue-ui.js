/* Revenue examples for Elsa Studio. Examples are not goals. Blank is unknown, not zero. */
(function (root) {
  var COPY = function () { return root.REVENUE_COPY; };
  var viewLevel = '100K';
  var viewPath = 'mostly';
  var detailsOpen = false;
  var mathOpen = {};
  var API = null;
  var SHARES = {
    mostly: { bride: 0.6, party: 0.2, addon: 0.5, social: 0.7, prom: 0.5, quince: 0.6, photo: 0.8, private: 1, group: 1 },
    balanced: { bride: 0.6, party: 0.2, addon: 0.5, social: 0.7, prom: 0.5, quince: 0.6, photo: 0.8, private: 1, group: 1 },
    team: { bride: 0.35, party: 0, addon: 0.5, social: 0.3, prom: 0.25, quince: 0.3, photo: 0.5, private: 1, group: 1 },
    lighter: { bride: 0.5, party: 0, addon: 0.8, social: 0.25, prom: 0.25, quince: 0.3, photo: 0.5, private: 1, group: 1 }
  };
  var BASE = {
    mostly: { weddings: 36, social: 20, private: 6, addonRate: 0.5 },
    balanced: { weddings: 18, social: 46, prom: 10, quince: 14, photo: 16, private: 8, group: 10, headshots: 8, addonRate: 0.5 },
    team: { weddings: 18, social: 36, prom: 10, quince: 16, photo: 12, group: 16, headshots: 12, touch: 8, addonRate: 0.5 }
  };
  var LIGHTER = { weddings: 10, social: 24, socialPeople: 4, photo: 12, addonRate: 1.5 };

  function lang() { return API && API.lang ? API.lang() : 'en'; }
  function esc(s) { return API.esc(s == null ? '' : s); }
  function t(key, map) {
    var row = COPY().ui[key];
    if (!row) return key;
    var s = row[lang()] || row.en || key;
    if (map) Object.keys(map).forEach(function (k) { s = s.split('{' + k + '}').join(String(map[k])); });
    return s;
  }
  function money(n) {
    if (n == null || !isFinite(Number(n))) return '—';
    var x = Number(n);
    return new Intl.NumberFormat(lang() === 'es' ? 'es-US' : 'en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: (Math.round(x) === x ? 0 : 2)
    }).format(x);
  }
  function num(n, d) {
    if (n == null || !isFinite(Number(n))) return '—';
    var x = Number(n);
    var p = d == null ? 0 : d;
    return new Intl.NumberFormat(lang() === 'es' ? 'es-US' : 'en-US', {
      minimumFractionDigits: p, maximumFractionDigits: p
    }).format(x);
  }
  function pct(n) {
    return new Intl.NumberFormat(lang() === 'es' ? 'es-US' : 'en-US', { style: 'percent', maximumFractionDigits: 0 }).format(n);
  }
  function badge(code) {
    var label = {
      FACT: t('fromSite'), CALC: t('ourMathShort'), ASSUMED: t('estimate'),
      ASK: t('yourAnswer'), YOURS: t('yours'), REF: t('refLabel'), NOT2027: t('not2027'), MATH: t('ourMath')
    }[code] || code;
    return '<span class="badge">' + esc(label) + '</span>';
  }
  function state() { return API.getState(); }
  function mix() {
    var m = state().revenueMix;
    if (!m || typeof m !== 'object' || Array.isArray(m)) return null;
    return m;
  }
  function ensure() {
    var st = state();
    if (st.revenueMix == null) {
      st.revenueMix = { version: 1, chosenGoal: null, goalBasis: null, streams: {}, costs: {}, capacity: {}, answers: {} };
    }
    var m = st.revenueMix;
    if (typeof m !== 'object' || Array.isArray(m)) return null;
    if (!m.streams || typeof m.streams !== 'object' || Array.isArray(m.streams)) m.streams = {};
    if (!m.costs || typeof m.costs !== 'object') m.costs = {};
    if (!m.capacity || typeof m.capacity !== 'object') m.capacity = {};
    if (!m.answers || typeof m.answers !== 'object') m.answers = {};
    if (m.version == null) m.version = 1;
    if (!Object.prototype.hasOwnProperty.call(m, 'chosenGoal')) m.chosenGoal = null;
    return m;
  }
  function touch() {
    var m = mix();
    if (!m) return;
    m.updatedAt = new Date().toISOString();
    if (API.save) API.save();
  }
  function storedNum(bucket, key) {
    var m = mix();
    var bag = m && m[bucket];
    if (!bag || !Object.prototype.hasOwnProperty.call(bag, key)) return null;
    var n = bag[key];
    return n == null || n === '' || !isFinite(Number(n)) ? null : Number(n);
  }
  function partyPer() {
    var n = storedNum('assumptions', 'partyPerWedding');
    return n == null ? 4 : n;
  }
  function assumptions() {
    return {
      party: partyPer(),
      peakSat: storedNum('capacity', 'peakSaturdays') == null ? 26 : storedNum('capacity', 'peakSaturdays'),
      peakShare: storedNum('capacity', 'peakShare') == null ? 0.76 : storedNum('capacity', 'peakShare'),
      hoursLimit: storedNum('capacity', 'hoursPerWeek'),
      admin: storedNum('capacity', 'adminHoursPerWeek'),
      weeksOff: storedNum('capacity', 'weeksOff'),
      teams: storedNum('capacity', 'teamsPerSaturday'),
      pay: storedNum('costs', 'payoutRate'),
      miles: storedNum('costs', 'milesAnnual'),
      mileRate: storedNum('costs', 'mileageRate') == null ? 0.76 : storedNum('costs', 'mileageRate')
    };
  }
  function workingWeeks(a) {
    if (a.weeksOff == null) return { weeks: 52, applied: false };
    var w = Math.max(1, 52 - a.weeksOff);
    return { weeks: w, applied: true };
  }
  function scaleMap(base, n) {
    var counts = { weddings: 1, social: 1, prom: 1, quince: 1, photo: 1, private: 1, group: 1, headshots: 1, touch: 1 };
    var o = {};
    Object.keys(base).forEach(function (k) { o[k] = counts[k] ? base[k] * n : base[k]; });
    return o;
  }
  function specFor(id, level) {
    if (id === 'lighter') return LIGHTER;
    var n = level === '300K' ? 3 : level === '200K' ? 2 : 1;
    return scaleMap(BASE[id], n);
  }
  function build(id, level, a) {
    var spec = specFor(id, level);
    var shares = SHARES[id];
    var partyN = a && a.party != null ? a.party : 4;
    var weddings = spec.weddings;
    var addons = Math.round(weddings * spec.addonRate);
    var party = weddings * partyN;
    var lines = [];
    function add(key, units, people, each, hours, share, visit, fact) {
      if (!units) return;
      var revenue = units * people * each;
      var artist = units * hours;
      lines.push({
        key: key, units: units, people: people, each: each, hours: hours, share: share, visit: visit,
        revenue: revenue, elsa: artist * share, team: artist * (1 - share), fact: fact, priced: true
      });
    }
    add('bride', weddings, 1, 1365, 11.5, shares.bride, true, true);
    add('party', party, 1, 280, 1.5, shares.party, false, true);
    add('addon', addons, 1, 175, 0.5, shares.addon, false, true);
    if (spec.social) add('social', spec.social, spec.socialPeople || 1, 280, (spec.socialPeople || 1) === 1 ? 3 : (spec.socialPeople * 1.5 + 1), shares.social, true, true);
    if (spec.prom) add('prom', spec.prom, 4, 280, 7, shares.prom, true, true);
    if (spec.quince) add('quince', spec.quince, 5, 280, 8.5, shares.quince, true, true);
    if (spec.photo) add('photo', spec.photo, 1, 280, 3, shares.photo, true, true);
    if (spec.private) add('private', spec.private, 1, 250, 5, shares.private, true, true);
    if (spec.group) add('group', spec.group, 5, 100, 5, shares.group, true, true);
    var unpriced = [];
    if (spec.headshots) unpriced.push({ key: 'headshots', units: spec.headshots });
    if (spec.touch) unpriced.push({ key: 'touch', units: spec.touch });
    var revenue = 0, elsa = 0, team = 0, visits = 0, teamVisits = 0, other = 0;
    lines.forEach(function (ln) {
      revenue += ln.revenue; elsa += ln.elsa; team += ln.team;
      if (ln.visit) {
        visits += ln.units;
        teamVisits += ln.units * (1 - ln.share);
        if (ln.key !== 'bride') other += ln.units;
      }
    });
    var teamParty = partyN * (1 - shares.party);
    var partyArtists = teamParty > 0 ? Math.ceil(teamParty / 5) : 0;
    var drive = weddings * partyArtists + weddings * (1 - shares.bride);
    team += drive;
    var peak = a.peakSat ? weddings * a.peakShare / a.peakSat : null;
    return {
      id: id, weddings: weddings, party: party, addons: addons, other: other, revenue: revenue,
      elsa: elsa, team: team, visits: visits, teamVisits: teamVisits, drive: drive, peak: peak,
      lines: lines, unpriced: unpriced, shares: shares
    };
  }
  function pathName(id) {
    var row = COPY().paths[id];
    return row[lang()] || row.en;
  }
  function weekHours(model, a) {
    var w = workingWeeks(a);
    var you = model.elsa / w.weeks + (a.admin == null ? 0 : a.admin);
    var team = model.team / w.weeks;
    return { you: you, team: team, weeks: w.weeks, applied: w.applied, baseYou: model.elsa / w.weeks };
  }
  function satPhrase(peak) {
    if (peak == null) return '—';
    if (peak < 0.75) return t('satOther');
    if (peak < 1.35) return t('satSome');
    return t('satLine', { n: num(peak, peak < 10 ? 1 : 0) });
  }
  function statusWord(have, limit) {
    if (limit == null || !isFinite(limit) || limit <= 0) return null;
    if (have <= limit) return 'fits';
    if (have <= limit * 1.15) return 'tight';
    return 'over';
  }
  function statusLabel(code) {
    if (code === 'fits') return t('fits');
    if (code === 'tight') return t('tight');
    if (code === 'over') return t('over');
    return '';
  }
  function notCounted(model) {
    if (!model.unpriced.length) return '';
    var parts = model.unpriced.map(function (u) {
      return u.key === 'headshots' ? t('headshots', { n: u.units }) : t('touchBlocks', { n: u.units });
    });
    return '<p>' + esc(t('notCounted', { what: parts.join(t('andWord')) })) + ' ' + badge('ASK') + '</p>';
  }
  function card(id, level, a, place) {
    var model = build(id, level, a);
    var dom = (place || 'path') + '-' + id;
    var hours = weekHours(model, a);
    var selected = viewPath === id;
    var works = id === 'mostly' ? t('worksMostly') : id === 'balanced' ? t('worksBalanced', { n: num(model.other / hours.weeks, 0) }) : id === 'team' ? t('worksTeam') : t('worksLight');
    var weddingLine = id === 'team' ? t('weddingsTeam', { n: model.weddings }) : id === 'lighter' ? t('weddingsLight', { n: model.weddings }) : t('weddings', { n: model.weddings, party: a.party });
    var math = mathOpen[id] ? '<div class="rev-math">' + model.lines.map(function (ln) {
      var price = ln.people > 1 ? t('timesPeople', { price: money(ln.each), n: ln.people }) : money(ln.each);
      return '<p>' + esc(ln.units + ' · ' + price) + ' ' + badge('FACT') + (ln.people > 1 ? badge('CALC') : '') + ' ' + badge('NOT2027') + '</p>';
    }).join('') + '<p>' + esc(t('adultNote')) + '</p><p>' + esc(t('driveEst')) + ' ' + badge('ASSUMED') + '</p></div>' : '';
    return '<article class="rev-path' + (selected ? ' selected' : '') + '" id="' + dom + '" data-path="' + id + '"><h3>' + esc(pathName(id)) + '</h3><p class="rev-en">' + esc(t('ribbon')) + '</p><p><strong>' + esc(t('exampleTotal', { amount: money(model.revenue) })) + '</strong> ' + badge('CALC') + '</p>' + (id === 'lighter' ? '<p>' + esc(t('notPromise')) + '</p>' : '') + '<ul><li>' + esc(weddingLine) + '</li><li>' + esc(t('other', { n: model.other })) + '</li><li>' + esc(t(id === 'lighter' ? 'youTeamLight' : 'youTeam', { you: num(Math.round(hours.you), 0), team: num(Math.round(hours.team), 0) })) + '</li><li>' + esc(satPhrase(model.peak)) + '</li></ul><p>' + esc(works) + '</p>' + (id === 'mostly' ? '<p>' + esc(t('keepMostly')) + '</p>' : '') + notCounted(model) + '<p>' + esc(id === 'lighter' ? t('pauseLight') : t('pause')) + '</p><div class="buttons"><button class="btn" type="button" data-action="rev-math" data-id="' + id + '">' + esc(mathOpen[id] ? t('hideMath') : t('seeMath')) + '</button><button class="btn" type="button" data-action="rev-plan" data-id="' + id + '">' + esc(t('startPlan')) + '</button><button class="btn soft" type="button" data-action="rev-select" data-id="' + id + '">' + esc(t('timeFor', { name: pathName(id) })) + '</button></div>' + math + '</article>';
  }
  function timeCheck(a) {
    var model = build(viewPath, viewPath === 'lighter' ? '100K' : viewLevel, a);
    var hours = weekHours(model, a);
    var youStatus = statusWord(hours.you, a.hoursLimit);
    var satStatus = statusWord(model.peak, a.teams);
    var perWeek = model.visits / hours.weeks;
    var perMonth = model.visits / (hours.weeks / 4.345);
    var teamMonth = model.teamVisits / (hours.weeks / 4.345);
    var youBits = '<p id="rev-you-hours" data-hours="' + hours.you.toFixed(4) + '"><strong>' + esc(t('youLine', { hours: num(hours.you, 1) })) + '</strong></p>';
    youBits += a.hoursLimit == null ? '<p>' + esc(t('noLimit')) + '</p>' : '<p>' + esc(t('limitLine', { n: num(a.hoursLimit, 0), status: statusLabel(youStatus) })) + ' ' + esc(t('heavier')) + '</p>';
    var sat = '<p id="rev-sat-figure" data-peak="' + (model.peak == null ? '' : model.peak.toFixed(4)) + '">' + esc(t('satCheck', { n: model.peak == null ? '—' : num(model.peak, 2) })) + '</p>';
    sat += a.teams == null ? '<p>' + esc(t('teamsAsk')) + '</p>' : '<p>' + esc(t('teamsLine', { n: num(a.teams, 0), status: statusLabel(satStatus) })) + '</p>';
    return '<section class="rev-section" id="rev-time"><h2 class="serif">' + esc(t('timeTitle')) + '</h2><p>' + esc(t('timeFor', { name: pathName(viewPath) })) + '</p>' + youBits + sat + '<p>' + esc(t('teamWeek', { n: num(hours.team, 1) })) + '</p><h3>' + esc(t('flexTitle')) + '</h3><p>' + esc(t('visitsWeek', { n: num(perWeek, 1) })) + '</p><p>' + esc(t('visitsMonth', { n: num(perMonth, 1) })) + '</p><p>' + esc(t('handoff', { n: num(teamMonth, 1) })) + '</p><p>' + esc(t('hoursCaveat')) + '</p><p>' + esc(a.admin == null ? t('adminBlank') : '') + '</p><div class="rev-fields"><div><label for="rev-admin">' + esc(t('adminAdd')) + '</label><input id="rev-admin" inputmode="decimal" data-rev="admin" value="' + esc(a.admin == null ? '' : String(a.admin)) + '"></div><div><label for="rev-weeks-off">' + esc(t('weeksOff')) + '</label><input id="rev-weeks-off" inputmode="decimal" data-rev="weeks-off" value="' + esc(a.weeksOff == null ? '' : String(a.weeksOff)) + '"></div><div><label for="rev-busy-sat">' + esc(t('busySat')) + '</label><input id="rev-busy-sat" inputmode="decimal" data-rev="busy-sat" value="' + esc(String(a.peakSat)) + '"><p class="rev-en">' + esc(t('rough')) + ' ' + badge('ASSUMED') + '</p></div><div><label for="rev-season-share">' + esc(t('seasonShare')) + '</label><input id="rev-season-share" inputmode="decimal" data-rev="season-share" value="' + esc(String(Math.round(a.peakShare * 100))) + '"><p class="rev-en">' + esc(t('national')) + ' ' + badge('REF') + '</p></div></div><p>' + esc(hours.applied ? t('weeksOn', { n: hours.weeks }) : t('weeksBlank')) + '</p><p>' + esc(viewPath === 'lighter' ? t('pauseLight') : t('pause')) + '</p></section>';
  }
  function ideaCard(item) {
    var formula = item.formula ? '<p>' + esc(lang() === 'es' ? item.formula.es : item.formula.en) + ' ' + badge('FACT') + badge('CALC') + '</p>' : '';
    return '<article class="rev-card" id="idea-' + item.id + '" data-idea="' + item.id + '"><h3>' + esc(lang() === 'es' ? item.es : item.en) + '</h3><p><strong>' + esc(t('why')) + '</strong> ' + esc(lang() === 'es' ? item.why.es : item.why.en) + '</p>' + formula + '<p><strong>' + esc(t('when')) + '</strong> ' + esc(lang() === 'es' ? item.when.es : item.when.en) + '</p><p><strong>' + esc(t('who')) + '</strong> ' + esc(lang() === 'es' ? item.who.es : item.who.en) + '</p><p><strong>' + esc(t('step')) + '</strong> ' + esc(lang() === 'es' ? item.step.es : item.step.en) + '</p><p><strong>' + esc(t('need')) + '</strong> ' + esc(lang() === 'es' ? item.need.es : item.need.en) + ' ' + badge('ASK') + '</p>' + (item.ref ? '<p>' + esc(lang() === 'es' ? item.ref.es : item.ref.en) + ' ' + badge('REF') + ' ' + badge('MATH') + '</p>' : '') + '</article>';
  }
  function ideas(m) {
    var teen = m && m.teenGroups === true;
    var cards = COPY().ideas.map(ideaCard).join('');
    var prom = '';
    if (teen) prom = ideaCard(COPY().prom);
    var choice = '<p>' + esc(t('teenAsk')) + '</p><div class="buttons"><button class="btn' + (teen ? ' primary' : '') + '" type="button" data-action="rev-teen" data-id="yes">' + esc(t('yes')) + '</button><button class="btn' + (m && m.teenGroups === false ? ' primary' : '') + '" type="button" data-action="rev-teen" data-id="no">' + esc(t('no')) + '</button></div>';
    return '<section class="rev-section" id="rev-ideas"><h2 class="serif">' + esc(t('ideas')) + '</h2><div class="stack">' + cards + choice + prom + '</div></section>';
  }
  function questions(a) {
    return '<section class="rev-section" id="rev-questions"><h2 class="serif">' + esc(t('questions')) + '</h2><div class="rev-fields"><div><label for="rev-party">' + esc(t('qParty')) + '</label><input id="rev-party" inputmode="decimal" data-rev="party" value="' + esc(String(a.party)) + '"> ' + badge('ASSUMED') + '</div><div><label for="rev-teams">' + esc(t('qTeams')) + '</label><input id="rev-teams" inputmode="decimal" data-rev="teams" value="' + esc(a.teams == null ? '' : String(a.teams)) + '"> ' + badge(a.teams == null ? 'ASK' : 'YOURS') + '</div><div><label for="rev-pay">' + esc(t('qPay')) + '</label><input id="rev-pay" inputmode="decimal" data-rev="pay" value="' + esc(a.pay == null ? '' : String(Math.round(a.pay * 100))) + '"> ' + badge(a.pay == null ? 'ASK' : 'YOURS') + '</div></div><button class="btn" type="button" data-action="rev-details" data-id="open">' + esc(t('moreQ')) + '</button></section>';
  }
  function goalBlock(a) {
    var g = API.goal ? API.goal() : null;
    var st = state();
    var legacy = root.__legacyEligible && !g && !root.__legacyHold;
    var plan = planTotals();
    var gap = '';
    if (g && plan.revenue != null) {
      var diff = Number(g.target) - plan.revenue;
      gap = diff >= 0 ? t('gapLine', { have: money(plan.revenue), goal: money(g.target), gap: money(diff) }) : t('gapOver', { have: money(plan.revenue), gap: money(Math.abs(diff)) });
    } else if (g) gap = t('gapEmpty');
    var legacyHtml = legacy ? '<p>' + esc(t('legacy', { amount: money(st.settings.annualGoal) })) + '</p><div class="buttons"><button class="btn soft" type="button" data-action="use-legacy-goal">' + esc(t('keep')) + '</button><button class="btn" type="button" data-action="legacy-not-now">' + esc(t('notNow')) + '</button></div>' : '';
    var pressed = function (id) { return (mix() && mix().capacity && mix().capacity.hoursPace === id) ? 'true' : 'false'; };
    return '<section class="rev-hours" id="rev-hours-hero"><p class="kicker">' + esc(t('kicker')) + '</p><h2>' + esc(t('hoursTitle')) + '</h2><p>' + esc(t('hoursHelp')) + '</p><div class="rev-picks" role="group"><button type="button" data-action="rev-pace" data-id="light" aria-pressed="' + pressed('light') + '">' + esc(t('light')) + '</button><button type="button" data-action="rev-pace" data-id="medium" aria-pressed="' + pressed('medium') + '">' + esc(t('medium')) + '</button><button type="button" data-action="rev-pace" data-id="full" aria-pressed="' + pressed('full') + '">' + esc(t('full')) + '</button></div><label for="rev-hours-limit">' + esc(t('hoursSet')) + '</label><input id="rev-hours-limit" inputmode="decimal" data-rev="hours-limit" value="' + esc(a.hoursLimit == null ? '' : String(a.hoursLimit)) + '" placeholder="' + esc(t('hoursBlank')) + '"><hr class="rose-rule"><h2 class="serif">' + esc(t('goalTitle')) + '</h2>' + (g ? '<p class="goal-figure">' + esc(money(g.target)) + '</p><p>' + esc(gap) + '</p><button class="btn soft" type="button" data-action="edit-goal">' + esc(t('editGoal')) + '</button>' : '<p><strong>' + esc(t('notSet')) + '</strong></p><p>' + esc(t('goalHelp')) + '</p><button class="btn primary" type="button" data-action="edit-goal">' + esc(t('setGoal')) + '</button>') + legacyHtml + '<p class="rev-en">' + esc(t('planNote')) + '</p></section>';
  }
  function planTotals() {
    var m = mix();
    if (!m || !m.streams) return { revenue: null };
    var any = false, rev = 0, missing = false;
    Object.keys(m.streams).forEach(function (id) {
      var row = m.streams[id];
      if (!row || !row.enabled) return;
      any = true;
      if (row.units == null || row.ticket == null) { missing = true; return; }
      rev += Number(row.units) * Number(row.people || 1) * Number(row.ticket);
    });
    if (!any || missing) return { revenue: any && !missing ? rev : (any ? null : null), known: rev };
    return { revenue: rev };
  }
  function details(a) {
    if (!detailsOpen) return '';
    var levels = ['100K', '200K', '300K'];
    var ids = ['mostly', 'balanced', 'team'];
    var compare = '';
    levels.forEach(function (level) {
      compare += '<h3>' + esc(level) + '</h3><div class="stack">' + ids.map(function (id) { return card(id, level, a, 'cmp-' + level); }).join('') + '</div>';
    });
    var perHourRows = [
      ['One social visit', '$280 / 3 h', 93],
      ['Four people, one address', '$280 × 4 / 7 h', 160],
      ['Bride, Timeless example', '$1,365 / 11.5 h', 119],
      ['One party service', '$280 / 1.5 h', 187],
      ['Second Look', '$175 / 0.5 h', 350],
      ['Private class', '$250 / 5 h', 50],
      ['Group class, 5 people', '$100 × 5 / 5 h', 100]
    ];
    var perHour = perHourRows.map(function (r) {
      return '<p>' + esc(lang() === 'es' ? r[0] : r[0]) + ' · ' + esc(r[1]) + ' · ' + esc(money(r[2])) + ' ' + badge('FACT') + badge('CALC') + '</p>';
    }).join('');
    var take = takeHome(a);
    var more = '<div id="rev-more-ideas">' + COPY().more.map(function (item) {
      return '<p>' + esc(lang() === 'es' ? item.es : item.en) + '</p>';
    }).join('') + '</div>';
    var months = '<ol class="rev-year">' + COPY().months.map(function (mo) {
      return '<li><strong>' + esc(lang() === 'es' ? mo.es : mo.en) + '</strong><span>' + esc(lang() === 'es' ? mo.esNote : mo.enNote) + '</span></li>';
    }).join('') + '</ol>';
    var words = COPY().glossary.map(function (g) {
      return '<article class="rev-card"><h3>' + esc(lang() === 'es' ? g.es : g.en) + '</h3><p>' + esc(lang() === 'es' ? g.esBody : g.enBody) + '</p></article>';
    }).join('');
    var qs = COPY().questions.map(function (q) {
      var val = (mix() && mix().answers && mix().answers[q.id]) || '';
      return '<label for="rev-q-' + q.id + '">' + esc(lang() === 'es' ? q.es : q.en) + '</label><textarea id="rev-q-' + q.id + '" data-rev="answer" data-qid="' + q.id + '">' + esc(val) + '</textarea>';
    }).join('');
    var rate = storedNum('answers', 'bookingRate');
    var inquiries = '';
    if (rate != null && rate > 0) {
      var model = build(viewPath, viewPath === 'lighter' ? '100K' : viewLevel, a);
      var need = Math.round((model.weddings + model.other) / (rate / 10));
      inquiries = '<p>' + esc(t('inquiries', { n: need, rate: rate })) + '</p><button class="btn" type="button" data-action="tab" data-id="Leads">' + esc(lang() === 'es' ? 'Abrir clientas' : 'Open leads') + '</button>';
    }
    return '<div id="rev-details-body"><section class="rev-section" id="rev-builder"><h2 class="serif">' + esc(t('builder')) + '</h2>' + (mix() && mix().loadedExample ? '<p>' + esc(t('loaded')) + '</p>' : '') + builder(a) + '</section><section class="rev-section" id="rev-compare"><h2 class="serif">' + esc(t('compare')) + '</h2>' + compare + '</section><section class="rev-section" id="rev-per-hour"><h2 class="serif">' + esc(t('perHour')) + '</h2>' + perHour + '</section><section class="rev-section" id="rev-takehome"><h2 class="serif">' + esc(t('takeHome')) + '</h2>' + take + '</section><section class="rev-section"><h2 class="serif">' + esc(t('seasons')) + '</h2><p>' + esc(t('seasonSoft')) + '</p>' + months + '</section><section class="rev-section"><h2 class="serif">' + esc(t('estimates')) + '</h2><p>' + esc(t('driveEst')) + '</p><button class="btn" type="button" data-action="rev-reset">' + esc(t('reset')) + '</button></section><section class="rev-section" id="rev-more">' + '<h2 class="serif">' + esc(t('moreIdeas')) + '</h2>' + more + '</section><section class="rev-section" id="rev-sources"><h2 class="serif">' + esc(t('sources')) + '</h2><p>' + esc(t('travelQ')) + ' ' + badge('ASK') + '</p><p class="rev-en">' + esc(t('englishNote')) + '</p>' + sourceList() + '<p>The Knot 2026 study: national average couple hair-and-makeup spend $300. It is national, and it is not your package price.</p><p>Mi Padrino, 2019: a platform survey put a whole quince near $21,781. That is not your fee, and it is not Dallas–Fort Worth.</p><p>About 525,000 quinces a year is a national figure from that same 2019 note, not a booking forecast.</p><p>BLS wage figures are context for team pay in the wider market. They are not your income.</p><p>Texas film incentives are a demand note for production days, not a booking.</p></section><section class="rev-section" id="rev-words"><h2 class="serif">' + esc(t('glossary')) + '</h2><div class="rev-grid two">' + words + '</div><h3>' + esc(t('moreQ')) + '</h3>' + qs + inquiries + '</section></div>';
  }
  function sourceList() {
    var list = (root.REVENUE_MODEL && root.REVENUE_MODEL.sources) || [];
    return '<ul>' + list.map(function (s) {
      var url = typeof s.url === 'string' && s.url.indexOf('https://') === 0 ? s.url : '';
      var link = url ? '<a href="' + esc(url) + '" rel="noopener noreferrer">' + esc(s.id) + '</a>' : esc(s.id);
      return '<li>' + link + ' <span class="rev-en">' + esc(s.note || '') + '</span></li>';
    }).join('') + '</ul>';
  }
  function takeHome(a) {
    if (a.pay == null) return '<p>' + esc(t('takeHidden')) + '</p>';
    var model = build(viewPath, viewPath === 'lighter' ? '100K' : viewLevel, a);
    var teamPay = 0;
    model.lines.forEach(function (ln) { teamPay += ln.revenue * (1 - ln.share) * a.pay; });
    var supplies = model.revenue * 0.05;
    var processing = model.revenue * 0.03;
    var mileage = a.miles == null ? 0 : a.miles * a.mileRate;
    var left = model.revenue - teamPay - supplies - processing - mileage;
    var per = model.elsa > 0 ? left / model.elsa : null;
    return '<p id="rev-take-figure" data-left="' + left.toFixed(2) + '"><strong>' + esc(money(left)) + '</strong></p><p>' + esc(t('notProfit')) + '</p>' + (a.miles == null ? '<p>' + esc(t('beforeDrive')) + '</p>' : '') + '<p>' + esc(t('perHourYou')) + ': ' + esc(per == null ? '—' : money(per)) + '</p><label for="rev-miles">' + esc(t('milesQ')) + '</label><input id="rev-miles" inputmode="decimal" data-rev="miles" value="' + esc(a.miles == null ? '' : String(a.miles)) + '">';
  }
  function builder(a) {
    var rows = planRows(a);
    return '<div class="stack">' + rows.map(function (row) {
      var price = row.people > 1 ? t('timesPeople', { price: money(row.each), n: row.people }) : (row.each == null ? t('enterPrice') : money(row.each));
      return '<article class="rev-row"><h3>' + esc(row.label) + '</h3><p>' + esc(price) + ' ' + (row.each == null ? badge('ASK') : badge('FACT')) + (row.people > 1 ? badge('CALC') : '') + '</p><label for="rev-u-' + row.id + '">' + esc(t('count')) + '</label><input id="rev-u-' + row.id + '" inputmode="numeric" data-rev="units" data-stream="' + row.id + '" value="' + esc(row.units == null ? '' : String(row.units)) + '"></article>';
    }).join('') + '</div><button class="btn" type="button" data-action="rev-clear">' + esc(t('clearPlan')) + '</button>';
  }
  function planRows(a) {
    var saved = (mix() && mix().streams) || {};
    var catalog = [
      ['wedding_bride', 'Bridal', 'Novias', 1365, 1],
      ['wedding_party', 'Bridesmaids and mothers', 'Damas y mamás', 280, 1],
      ['wedding_addons', 'Second Look and Elsa personally', 'Second Look y Elsa en persona', 175, 1],
      ['social_glam', 'Social glam', 'Glam social', 280, 1],
      ['prom_homecoming', 'Prom or homecoming group', 'Grupo de prom o homecoming', 280, 4],
      ['quinceanera', 'Quinceañera court', 'Corte de quinceañera', 280, 5],
      ['photo_partners', 'Photo session', 'Sesión de fotos', 280, 1],
      ['private_classes', 'Private class', 'Clase privada', 250, 1],
      ['group_classes', 'Group class', 'Clase en grupo', 100, 5],
      ['corporate_headshots', 'Business headshot day', 'Día de fotos para empresas', null, 1],
      ['event_touchups', 'Touch-up block', 'Bloque de retoques', null, 1],
      ['corporate_workshops', 'Workshop', 'Taller', null, 1],
      ['membership', 'Monthly glam visit', 'Visita mensual de glam', null, 1],
      ['gift_cards', 'Gift card', 'Tarjeta de regalo', null, 1],
      ['digital_guides', 'Digital guide', 'Guía digital', null, 1],
      ['affiliate', 'Product link', 'Enlace de producto', null, 1],
      ['retail_kits', 'Kit', 'Kit', null, 1],
      ['production', 'Production day', 'Día de producción', null, 1],
      ['pageant_dance', 'Pageant or dance block', 'Bloque de certamen o danza', null, 1],
      ['vendor_referrals', 'Referral', 'Recomendación', null, 1],
      ['destination', 'Destination wedding', 'Boda destino', null, 1]
    ];
    return catalog.map(function (c) {
      var savedRow = saved[c[0]] || {};
      var people = savedRow.people || c[4];
      return { id: c[0], label: lang() === 'es' ? c[2] : c[1], each: c[3], people: people, units: savedRow.units == null ? null : savedRow.units };
    });
  }
  function render(api) {
    API = api;
    var a = assumptions();
    var example = API.example && API.example() ? '<p class="example-banner">' + esc(t('exampleMode')) + '</p>' : '';
    var levels = ['100K', '200K', '300K'].map(function (level) {
      return '<button class="btn' + (viewLevel === level ? ' primary' : '') + '" type="button" data-action="rev-level" data-id="' + level + '">' + level + '</button>';
    }).join('');
    var three = ['mostly', 'balanced', 'team'].map(function (id) { return card(id, viewLevel, a); }).join('');
    var first = '<div id="rev-first">' + goalBlock(a) +
      '<section class="rev-section" id="rev-switch"><h2 class="serif">' + esc(t('explore')) + '</h2><p class="rev-ribbon" id="rev-ribbon">' + esc(t('ribbon')) + '</p><div class="rev-level">' + levels + '</div><p>' + esc(t('lighterNote')) + '</p><button class="btn' + (viewPath === 'lighter' ? ' primary' : '') + '" type="button" id="rev-lighter-toggle" data-action="rev-select" data-id="lighter">' + esc(t('lighterToggle')) + '</button></section>' +
      '<section class="rev-section" id="rev-paths"><h2 class="serif">' + esc(t('paths')) + '</h2><div class="stack">' + three + '</div><p>' + esc(t('hoursCaveat')) + '</p><p>' + esc(t('satStory')) + '</p></section>' +
      card('lighter', '100K', a) +
      timeCheck(a) + ideas(mix()) + questions(a) +
      '<button class="btn primary" type="button" id="rev-details-toggle" data-action="rev-details">' + esc(detailsOpen ? t('hideDetails') : t('details')) + '</button></div>';
    return '<div class="rev" id="rev-root">' + example + first + details(a) + '</div>';
  }
  function parse(raw) {
    if (raw == null || String(raw).trim() === '') return null;
    var n = Number(raw);
    return isFinite(n) ? n : null;
  }
  function onField(el) {
    if (!el || !el.dataset) return;
    var kind = el.dataset.rev;
    if (!kind) return;
    var m = ensure();
    if (!m) return;
    var n = parse(el.value);
    if (kind === 'hours-limit') { m.capacity.hoursPerWeek = n; m.capacity.hoursPace = null; }
    else if (kind === 'admin') m.capacity.adminHoursPerWeek = n;
    else if (kind === 'weeks-off') m.capacity.weeksOff = n;
    else if (kind === 'busy-sat') m.capacity.peakSaturdays = n == null ? 26 : n;
    else if (kind === 'season-share') m.capacity.peakShare = n == null ? 0.76 : n / 100;
    else if (kind === 'party') { m.assumptions = m.assumptions || {}; m.assumptions.partyPerWedding = n == null ? 4 : n; }
    else if (kind === 'teams') m.capacity.teamsPerSaturday = n;
    else if (kind === 'pay') m.costs.payoutRate = n == null ? null : n / 100;
    else if (kind === 'miles') m.costs.milesAnnual = n;
    else if (kind === 'units') {
      var row = m.streams[el.dataset.stream] || { enabled: true };
      row.units = n == null ? null : Math.round(n);
      row.unitsOrigin = 'user';
      row.enabled = true;
      m.streams[el.dataset.stream] = row;
      if (m.loadedExample) m.loadedExample.edited = true;
    } else if (kind === 'answer') {
      m.answers[el.dataset.qid] = el.value.slice(0, 500);
      if (el.dataset.qid === 'qRate') m.answers.bookingRate = n;
    }
    touch();
    rerender();
  }
  function copyPlan(id, a) {
    var model = build(id, id === 'lighter' ? '100K' : viewLevel, a);
    var m = ensure();
    if (!m) return;
    var next = {};
    model.lines.forEach(function (ln) {
      var sid = { bride: 'wedding_bride', party: 'wedding_party', addon: 'wedding_addons', social: 'social_glam', prom: 'prom_homecoming', quince: 'quinceanera', photo: 'photo_partners', private: 'private_classes', group: 'group_classes' }[ln.key];
      next[sid] = { enabled: true, units: ln.units, people: ln.people, unitsOrigin: 'scenario' };
    });
    model.unpriced.forEach(function (u) {
      var sid = u.key === 'headshots' ? 'corporate_headshots' : 'event_touchups';
      next[sid] = { enabled: true, units: u.units, unitsOrigin: 'scenario' };
    });
    m.streams = next;
    m.loadedExample = { path: id, level: viewLevel, edited: false };
    m.chosenGoal = m.chosenGoal == null ? null : m.chosenGoal;
    touch();
  }
  function rerender() {
    var y = window.scrollY;
    API.rerender();
    window.scrollTo(0, y);
  }
  function handle(action, node) {
    var id = node && node.dataset ? node.dataset.id : '';
    if (action === 'rev-level') { viewLevel = id || '100K'; if (viewPath === 'lighter') viewPath = 'mostly'; rerender(); return; }
    if (action === 'rev-select') { viewPath = id || 'mostly'; rerender(); return; }
    if (action === 'rev-math') { mathOpen[id] = !mathOpen[id]; rerender(); return; }
    if (action === 'rev-details') { detailsOpen = id === 'open' ? true : !detailsOpen; rerender(); var el = document.getElementById('rev-details-body'); if (el && detailsOpen && el.scrollIntoView) el.scrollIntoView({ block: 'start' }); return; }
    if (action === 'rev-pace') {
      var m = ensure();
      if (!m) return;
      var hours = id === 'medium' ? 20 : id === 'full' ? 30 : 10;
      m.capacity.hoursPerWeek = hours;
      m.capacity.hoursPace = id;
      if (!Object.prototype.hasOwnProperty.call(m, 'chosenGoal') || m.chosenGoal == null) m.chosenGoal = null;
      touch();
      rerender();
      return;
    }
    if (action === 'rev-teen') {
      var m2 = ensure();
      if (!m2) return;
      m2.teenGroups = id === 'yes';
      touch();
      rerender();
      return;
    }
    if (action === 'rev-plan') { copyPlan(id, assumptions()); viewPath = id; rerender(); return; }
    if (action === 'rev-clear') {
      if (!(API.confirm && API.confirm(t('clearAsk')))) return;
      var m3 = ensure();
      m3.streams = {};
      m3.loadedExample = null;
      touch();
      rerender();
      return;
    }
    if (action === 'rev-reset') {
      if (!(API.confirm && API.confirm(t('resetAsk')))) return;
      var m4 = ensure();
      m4.capacity = { hoursPerWeek: m4.capacity.hoursPerWeek, hoursPace: m4.capacity.hoursPace };
      m4.assumptions = {};
      m4.costs = { payoutRate: m4.costs.payoutRate };
      touch();
      rerender();
    }
  }
  function audit() {
    var a = { party: 4, peakSat: 26, peakShare: 0.76, hoursLimit: null, admin: null, weeksOff: null, teams: null, pay: null, miles: null, mileRate: 0.76 };
    var out = [];
    ['100K', '200K', '300K'].forEach(function (level) {
      var target = level === '300K' ? 300000 : level === '200K' ? 200000 : 100000;
      var ratios = [];
      ['mostly', 'balanced', 'team'].forEach(function (id) {
        var model = build(id, level, a);
        ratios.push(model.party / model.weddings + ':' + (model.addons / model.weddings));
        var priced = model.lines.every(function (ln) { return ln.fact && ln.revenue > 0; });
        var unpricedMoney = model.unpriced.reduce(function (s, u) { return s + (u.revenue || 0); }, 0);
        out.push({
          level: level, id: id, revenue: model.revenue, within: Math.abs(model.revenue / target - 1) <= 0.03,
          ratio: model.party / model.weddings === 4 && Math.abs(model.addons / model.weddings - 0.5) < 1e-9,
          integers: model.lines.every(function (ln) { return Number.isInteger(ln.units); }),
          priced: priced, unpricedMoney: unpricedMoney, peak: model.peak, elsaWeek: model.elsa / 52
        });
      });
    });
    var light = build('lighter', '100K', a);
    var peak26 = build('mostly', '100K', a).peak;
    var peak18 = build('mostly', '100K', Object.assign({}, a, { peakSat: 18 })).peak;
    return { rows: out, lighter: light.revenue, peak26: peak26, peak18: peak18, lightVisits: light.visits };
  }
  root.ElsaRevenue = { render: render, handle: handle, onField: onField, audit: audit, afterRender: function () {} };
})(typeof window !== 'undefined' ? window : globalThis);
