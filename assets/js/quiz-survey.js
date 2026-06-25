(function () {
	'use strict';

	var cfg = window.PS_QUIZ;
	if (!cfg) return;

	var root = document.getElementById('ps-quiz-survey');
	if (!root) return;

	var SCREENS = [
		{
			id: 'q2', step: 1, phaseTitle: 'Find Your Perfect Hot Tub',
			type: 'single', key: 'q2', question: 'How many people will use it?',
			options: [
				{ value: '1-2', label: '1–2' },
				{ value: '3-4', label: '3–4' },
				{ value: '5-6', label: '5–6' },
				{ value: '7+', label: '7+' }
			]
		},
		{
			id: 'q3', step: 1, phaseTitle: 'Find Your Perfect Hot Tub',
			type: 'multi', key: 'q3', question: 'Which features matter most?',
			subtitle: 'Choose as many options as you\u2019d like.',
			options: [
				{ value: 'massage', label: 'Powerful Massage' },
				{ value: 'water-care', label: 'Easy/Salt Water Care' },
				{ value: 'energy', label: 'Energy Efficiency' },
				{ value: 'smart', label: 'Smart Tech' }
			]
		},
		{
			id: 'q4', step: 1, phaseTitle: 'Find Your Perfect Hot Tub',
			type: 'single', key: 'q4', question: 'Interested in financing your hot tub for as low as $' + (cfg.FINANCING_MONTHLY || 59) + '/month?',
			options: [
				{ value: 'yes', label: 'Yes! Absolutely' },
				{ value: 'no', label: 'No' }
			]
		},
		{ id: 'zip', step: 1, phaseTitle: 'Find Your Perfect Hot Tub', type: 'zip' },
		{ id: 'schedule', step: 2, phaseTitle: 'Schedule Your Visit', type: 'schedule' },
		{ id: 'contact', step: 3, phaseTitle: 'Almost Finished\u2026', type: 'contact' },
		{ id: 'confirmation', step: 3, phaseTitle: "You're Almost Booked!", type: 'confirmation' }
	];

	var screenIndex = 0;
	var weekOffset = 0;
	var apptDate = null;
	var apptTime = null;

	function data() { return cfg.load(); }

	function labelQ1(values) {
		var map = {
			pain: 'Pain Relief & Recovery',
			stress: 'Stress Relief & Sleep',
			entertainment: 'Entertainment & Family',
			outdoors: 'More Time Outdoors'
		};
		return (values || []).map(function (v) { return map[v] || v; });
	}

	function formatDayCard(d) {
		var day = d.toLocaleDateString('en-US', { weekday: 'short' });
		var mm = String(d.getMonth() + 1).padStart(2, '0');
		var dd = String(d.getDate()).padStart(2, '0');
		return day + ' ' + mm + '/' + dd;
	}

	function formatRecap(d, time) {
		var day = d.toLocaleDateString('en-US', { weekday: 'long' });
		var mm = String(d.getMonth() + 1).padStart(2, '0');
		var dd = String(d.getDate()).padStart(2, '0');
		return day + ' ' + mm + '/' + dd + ' at ' + time;
	}

	function rollingDays(offset) {
		var days = [];
		var start = new Date();
		start.setHours(12, 0, 0, 0);
		start.setDate(start.getDate() + offset * 4);
		for (var i = 0; i < 4; i++) {
			var d = new Date(start);
			d.setDate(start.getDate() + i);
			days.push(d);
		}
		return days;
	}

	function setPhaseTitle(title) {
		var el = root.querySelector('[data-quiz-phase-title]');
		if (el) el.textContent = title;
		document.title = title + ' | Pure Soak';
	}

	function setStepper(step, allDone) {
		root.querySelectorAll('.ps-quiz-stepper__step').forEach(function (el) {
			var n = parseInt(el.getAttribute('data-step'), 10);
			var done = allDone || n < step;
			var active = !allDone && n === step;
			el.classList.toggle('is-active', active);
			el.classList.toggle('is-done', done);
			var num = el.querySelector('.ps-quiz-stepper__num');
			if (num) num.textContent = done ? '\u2713' : String(n);
		});
	}

	function esc(s) {
		var d = document.createElement('div');
		d.textContent = s;
		return d.innerHTML;
	}

	function renderOptions(screen, multi, current) {
		return screen.options.map(function (opt) {
			var on = multi
				? (current || []).indexOf(opt.value) !== -1
				: current === opt.value;
			return '<button type="button" class="ps-quiz__option' + (on ? ' is-selected' : '') + '" data-value="' + esc(opt.value) + '">' + esc(opt.label) + '</button>';
		}).join('');
	}

	var FIELD_META = {
		zip: {
			type: 'text',
			autocomplete: 'postal-code',
			inputName: 'postal-code',
			inputMode: 'numeric',
			maxLength: 5,
			pattern: '[0-9]*',
			placeholder: '5-digit zip'
		},
		name: {
			type: 'text',
			autocomplete: 'name',
			inputName: 'name',
			autocapitalize: 'words',
			placeholder: 'Full name'
		},
		phone: {
			type: 'tel',
			autocomplete: 'tel',
			inputName: 'phone',
			inputMode: 'tel',
			placeholder: '(555) 555-5555'
		},
		email: {
			type: 'email',
			autocomplete: 'email',
			inputName: 'email',
			autocapitalize: 'off',
			spellcheck: 'false',
			placeholder: 'you@example.com'
		}
	};

	function field(name, label, val) {
		var meta = FIELD_META[name] || {
			type: 'text',
			autocomplete: 'on',
			inputName: name
		};
		var attrs = [
			'class="ps-quiz__input"',
			'id="quiz-' + name + '"',
			'type="' + meta.type + '"',
			'name="' + esc(meta.inputName) + '"',
			'value="' + esc(val || '') + '"',
			'autocomplete="' + meta.autocomplete + '"',
			'data-quiz-field="' + name + '"',
			'aria-required="true"'
		];
		if (meta.inputMode) attrs.push('inputmode="' + meta.inputMode + '"');
		if (meta.maxLength) attrs.push('maxlength="' + meta.maxLength + '"');
		if (meta.pattern) attrs.push('pattern="' + meta.pattern + '"');
		if (meta.autocapitalize) attrs.push('autocapitalize="' + meta.autocapitalize + '"');
		if (meta.spellcheck === false) attrs.push('spellcheck="false"');
		if (meta.placeholder) attrs.push('placeholder="' + esc(meta.placeholder) + '"');
		return '<div class="ps-quiz__field"><label for="quiz-' + name + '">' + esc(label) + '</label><input ' + attrs.join(' ') + '><span class="ps-quiz__field-error" data-field-error="' + name + '" hidden></span></div>';
	}

	function getRecapText() {
		if (!apptDate || !apptTime) return '';
		var day = new Date(apptDate + 'T12:00:00');
		return formatRecap(day, apptTime);
	}

	function renderScreen() {
		var screen = SCREENS[screenIndex];
		var d = data();
		var isConfirmation = screen.type === 'confirmation';

		setPhaseTitle(screen.phaseTitle);
		setStepper(screen.step, isConfirmation);

		var backBtn = screenIndex > 0 && !isConfirmation
			? '<button type="button" class="ps-quiz__back" data-quiz-back>&larr; Back</button>'
			: '';

		var html = backBtn;
		var panel = root.querySelector('.ps-quiz-survey__panel');

		if (screen.type === 'single' || screen.type === 'multi') {
			html += '<h2 class="ps-quiz__question">' + esc(screen.question) + '</h2>';
			if (screen.subtitle) {
				html += '<p class="ps-quiz__question-sub">' + esc(screen.subtitle) + '</p>';
			}
			html += '<div class="ps-quiz__options" data-quiz-options>' + renderOptions(screen, screen.type === 'multi', d[screen.key]) + '</div>';
			if (screen.type === 'multi') {
				html += '<button type="button" class="ps-btn ps-btn--orange ps-btn--orange-lg ps-quiz__next" data-quiz-next>Continue &rarr;</button>';
			}
		} else if (screen.type === 'zip') {
			var zipVal = d.zip || '';
			html += '<div class="ps-quiz__tease ps-quiz__tease--inline">';
			html += '<p class="ps-quiz__tease-msg">&#10003; We matched you with 3 hot tubs + your $1,000-off coupon. Let\'s find a time near you.</p>';
			html += '</div>';
			html += '<h2 class="ps-quiz__question">Enter your zip to see which hot tubs are available near you right now</h2>';
			html += '<form class="ps-quiz__form" autocomplete="on" novalidate data-quiz-form="zip">';
			html += '<div class="ps-quiz__fields ps-quiz__fields--zip">';
			html += field('zip', 'Zip code', zipVal);
			html += '</div>';
			html += '<p class="ps-quiz__error" data-quiz-error hidden></p>';
			html += '<button type="submit" class="ps-btn ps-btn--orange ps-btn--orange-lg ps-quiz__next" data-quiz-zip-submit>Check Availability</button>';
			html += '</form>';
		} else if (screen.type === 'schedule') {
			var showroom = cfg.getShowroomForZip(d.zip);
			var days = rollingDays(weekOffset);
			html += '<h2 class="ps-quiz__question">Select a Date</h2>';
			html += '<div class="ps-quiz__date-cards">';
			days.forEach(function (day) {
				var iso = day.toISOString().slice(0, 10);
				var sel = apptDate === iso;
				html += '<button type="button" class="ps-quiz__date-card' + (sel ? ' is-selected' : '') + '" data-date="' + iso + '">' + esc(formatDayCard(day)) + '</button>';
			});
			html += '</div>';
			html += '<button type="button" class="ps-quiz__more-dates" data-show-more-dates>Show more dates</button>';
			html += '<div class="ps-quiz__times-wrap" data-quiz-times-wrap' + (apptDate ? '' : ' hidden') + '>';
			html += '<h2 class="ps-quiz__question">Select a Time</h2>';
			html += '<div class="ps-quiz__times" data-quiz-times>';
			showroom.times.forEach(function (t) {
				html += '<button type="button" class="ps-quiz__time' + (apptTime === t ? ' is-selected' : '') + '" data-time="' + esc(t) + '">' + esc(t) + '</button>';
			});
			html += '</div></div>';
		} else if (screen.type === 'contact') {
			var c = d.contact || {};
			var recap = getRecapText();
			html += '<div class="ps-quiz__recap">';
			html += '<p class="ps-quiz__recap-title">Your visit details &mdash; ' + esc(recap) + '</p>';
			html += '<p class="ps-quiz__recap-sub">Complete the form below to lock in your visit and claim your $1,000-off coupon.</p>';
			html += '<p class="ps-quiz__recap-perk">You\u2019ll see available inventory with pricing immediately after you reserve your visit.</p>';
			html += '</div>';
			html += '<form class="ps-quiz__form" autocomplete="on" novalidate data-quiz-form="contact">';
			html += '<div class="ps-quiz__fields">';
			var fullName = c.name || [c.firstName, c.lastName].filter(Boolean).join(' ');
			html += field('name', 'Your Name', fullName);
			html += field('email', 'Email', c.email || '');
			html += field('phone', 'Phone', c.phone || '');
			html += '</div>';
			html += '<label class="ps-quiz__consent"><input type="checkbox" data-quiz-consent' + (c.consent ? ' checked' : '') + '> <span>By submitting, I agree to receive calls, texts &amp; emails about my visit and offers. Reply STOP anytime. Consent isn\'t a condition of purchase.</span></label>';
			html += '<p class="ps-quiz__error" data-quiz-error hidden></p>';
			html += '<button type="submit" class="ps-btn ps-btn--orange ps-btn--orange-lg ps-quiz__next" data-quiz-reserve>Reserve My Visit</button>';
			html += '</form>';
		} else if (screen.type === 'confirmation') {
			var ap = d.appointment || {};
			var name = ((d.contact || {}).name || (d.contact || {}).firstName || 'Friend').split(' ')[0];
			html += '<p class="ps-quiz__confirm-intro">' + esc(name) + ', your visit is awaiting confirmation:</p>';
			html += '<div class="ps-quiz__confirm-card">';
			html += '<p><strong>' + esc(ap.displayRecap || getRecapText()) + '</strong></p>';
			html += '</div>';
			html += '<p class="ps-quiz__callout"><strong>NOT CONFIRMED until you answer our call and speak with our team.</strong></p>';
			html += '<p class="ps-quiz__sub">Please keep your phone line open.</p>';
		}

		panel.innerHTML = html;
		bindScreen(screen);
	}

	function go(delta) {
		screenIndex = Math.max(0, Math.min(SCREENS.length - 1, screenIndex + delta));
		renderScreen();
		window.scrollTo(0, 0);
	}

	function validateZip() {
		var panel = root.querySelector('.ps-quiz-survey__panel');
		var zipInput = panel.querySelector('[data-quiz-field="zip"]');
		var errBox = panel.querySelector('[data-quiz-error]');
		var zip = (zipInput.value || '').replace(/\D/g, '').slice(0, 5);
		if (zip.length !== 5) {
			var el = panel.querySelector('[data-field-error="zip"]');
			if (el) { el.textContent = 'Enter a 5-digit zip code.'; el.hidden = false; }
			return null;
		}
		var showroom = cfg.getShowroomForZip(zip);
		cfg.merge({ zip: zip, showroom: showroom.id });
		if (errBox) errBox.hidden = true;
		return zip;
	}

	function validateContact() {
		var panel = root.querySelector('.ps-quiz-survey__panel');
		var nameInput = panel.querySelector('[data-quiz-field="name"]');
		var phoneInput = panel.querySelector('[data-quiz-field="phone"]');
		var emailInput = panel.querySelector('[data-quiz-field="email"]');
		var consent = panel.querySelector('[data-quiz-consent]');
		var errBox = panel.querySelector('[data-quiz-error]');
		var ok = true;
		var contact = { zip: data().zip };

		function setErr(name, msg) {
			ok = false;
			var el = panel.querySelector('[data-field-error="' + name + '"]');
			if (el) { el.textContent = msg; el.hidden = !msg; }
		}

		['name', 'phone', 'email'].forEach(function (k) { setErr(k, ''); });

		contact.name = (nameInput.value || '').trim();
		if (!contact.name) { setErr('name', 'Please enter your name.'); }
		contact.firstName = contact.name.split(/\s+/)[0] || contact.name;

		var phoneRaw = (phoneInput.value || '').replace(/\D/g, '');
		if (phoneRaw.length < 10) { setErr('phone', 'Enter a valid 10-digit phone number.'); }
		contact.phone = phoneInput.value.trim();

		var email = (emailInput.value || '').trim();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Enter a valid email address.'); }
		contact.email = email;

		if (!consent.checked) {
			ok = false;
			if (errBox) { errBox.textContent = 'Please agree to be contacted.'; errBox.hidden = false; }
		} else if (errBox) {
			errBox.hidden = true;
		}

		contact.consent = consent.checked;
		if (!ok) return null;

		cfg.merge({ contact: contact });
		return contact;
	}

	function redirectToInventory() {
		// ?reserved=1 — wire inventory "visit reserved" banner later
		var base = cfg.INVENTORY_URL || 'inventory/';
		var url = new URL(base, window.location.href);
		url.searchParams.set('reserved', '1');
		window.location.assign(url.href);
	}

	function submitPayload() {
		var d = data();
		var showroom = cfg.SHOWROOMS[d.showroom] || cfg.SHOWROOMS[cfg.DEFAULT_SHOWROOM];
		var payload = {
			q1: labelQ1(d.q1),
			q1Values: d.q1 || [],
			q2: d.q2,
			q3: d.q3 || [],
			q4: d.q4,
			zip: d.zip,
			showroom: {
				id: showroom.id,
				name: showroom.name,
				phone: showroom.phone
			},
			appointment: d.appointment,
			contact: d.contact
		};

		try {
			if (cfg.SUBMIT_URL) {
				return fetch(cfg.SUBMIT_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}).catch(function (e) { console.error('Quiz submit failed', e); });
			}
			console.log('Pure Soak quiz payload:', payload);
			return Promise.resolve();
		} catch (e) {
			console.error('Quiz submit failed', e);
			return Promise.resolve();
		}
	}

	function advanceToContact() {
		if (!apptDate || !apptTime) return;
		var day = new Date(apptDate + 'T12:00:00');
		var recap = formatRecap(day, apptTime);
		cfg.merge({
			appointment: {
				date: apptDate,
				time: apptTime,
				displayRecap: recap
			}
		});
		setTimeout(function () { go(1); }, 250);
	}

	var Q1_OPTIONS = [
		{ value: 'pain', label: 'Pain Relief & Recovery' },
		{ value: 'stress', label: 'Stress Relief & Sleep' },
		{ value: 'entertainment', label: 'Entertainment & Family' },
		{ value: 'outdoors', label: 'More Time Outdoors' }
	];

	function renderQ1Screen() {
		var d = data();
		var selected = Array.isArray(d.q1) ? d.q1.slice() : [];
		setPhaseTitle('Find Your Perfect Hot Tub');
		setStepper(1, false);

		var html = '<h2 class="ps-quiz__question">What\u2019s drawing you to a hot tub?</h2>';
		html += '<p class="ps-quiz__question-sub">Choose as many options as you\u2019d like.</p>';
		html += '<div class="ps-quiz__options" data-quiz-q1-options>';
		Q1_OPTIONS.forEach(function (opt) {
			var on = selected.indexOf(opt.value) !== -1;
			html += '<button type="button" class="ps-quiz__option' + (on ? ' is-selected' : '') + '" data-value="' + esc(opt.value) + '">' + esc(opt.label) + '</button>';
		});
		html += '</div>';
		html += '<button type="button" class="ps-btn ps-btn--orange ps-btn--orange-lg ps-quiz__next" data-quiz-q1-continue' + (selected.length ? '' : ' disabled') + '>Continue &rarr;</button>';

		var panel = root.querySelector('.ps-quiz-survey__panel');
		panel.innerHTML = html;

		var continueBtn = panel.querySelector('[data-quiz-q1-continue]');
		panel.querySelectorAll('[data-quiz-q1-options] .ps-quiz__option').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var val = btn.getAttribute('data-value');
				var idx = selected.indexOf(val);
				if (idx === -1) selected.push(val);
				else selected.splice(idx, 1);
				btn.classList.toggle('is-selected', selected.indexOf(val) !== -1);
				cfg.merge({ q1: selected.slice() });
				if (continueBtn) continueBtn.disabled = selected.length === 0;
			});
		});

		if (continueBtn) {
			continueBtn.addEventListener('click', function () {
				if (!selected.length) return;
				cfg.merge({ q1: selected.slice() });
				renderScreen();
			});
		}
	}

	function bindScreen(screen) {
		var panel = root.querySelector('.ps-quiz-survey__panel');
		var back = panel.querySelector('[data-quiz-back]');
		if (back) back.addEventListener('click', function () { go(-1); });

		if (screen.type === 'single') {
			panel.querySelectorAll('[data-quiz-options] .ps-quiz__option').forEach(function (btn) {
				btn.addEventListener('click', function () {
					btn.classList.add('is-selected');
					cfg.merge({ [screen.key]: btn.getAttribute('data-value') });
					setTimeout(function () { go(1); }, 150);
				});
			});
		}

		if (screen.type === 'multi') {
			var selected = (data()[screen.key] || []).slice();
			panel.querySelectorAll('[data-quiz-options] .ps-quiz__option').forEach(function (btn) {
				btn.addEventListener('click', function () {
					var val = btn.getAttribute('data-value');
					var idx = selected.indexOf(val);
					if (idx === -1) selected.push(val);
					else selected.splice(idx, 1);
					btn.classList.toggle('is-selected', selected.indexOf(val) !== -1);
					cfg.merge({ [screen.key]: selected.slice() });
				});
			});
			var next = panel.querySelector('[data-quiz-next]');
			if (next) next.addEventListener('click', function () {
				if (!(data()[screen.key] || []).length) return;
				go(1);
			});
		}

		if (screen.type === 'zip') {
			var zipForm = panel.querySelector('[data-quiz-form="zip"]');
			if (zipForm) {
				zipForm.addEventListener('submit', function (e) {
					e.preventDefault();
					if (validateZip()) go(1);
				});
			}
		}

		if (screen.type === 'schedule') {
			var moreDates = panel.querySelector('[data-show-more-dates]');
			if (moreDates) moreDates.addEventListener('click', function () {
				weekOffset += 1;
				renderScreen();
			});
			panel.querySelectorAll('[data-date]').forEach(function (btn) {
				btn.addEventListener('click', function () {
					apptDate = btn.getAttribute('data-date');
					apptTime = null;
					renderScreen();
					setTimeout(function () {
						var timesWrap = root.querySelector('[data-quiz-times-wrap]');
						if (timesWrap) {
							timesWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
						}
					}, 80);
				});
			});
			panel.querySelectorAll('[data-time]').forEach(function (btn) {
				btn.addEventListener('click', function () {
					apptTime = btn.getAttribute('data-time');
					renderScreen();
					advanceToContact();
				});
			});
		}

		if (screen.type === 'contact') {
			var contactForm = panel.querySelector('[data-quiz-form="contact"]');
			if (contactForm) {
				contactForm.addEventListener('submit', function (e) {
					e.preventDefault();
					if (!validateContact()) return;
					submitPayload().finally(function () { redirectToInventory(); });
				});
			}
		}
	}

	var d0 = data();
	if (!d0.q1 || !d0.q1.length) {
		if (cfg.ALLOW_SURVEY_COLD_START) {
			renderQ1Screen();
			return;
		}
		window.location.href = cfg.HOME_REDIRECT || 'index.html#quote';
		return;
	}

	if (d0.appointment && d0.appointment.date) {
		apptDate = d0.appointment.date;
		apptTime = d0.appointment.time || null;
	}

	renderScreen();
})();