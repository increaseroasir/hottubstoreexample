(function () {
	'use strict';

	var PRICE_MIN = 4500;
	var PRICE_MAX = 14000;
	var MONTHLY_MIN = 75;
	var MONTHLY_MAX = 200;

	var MAKE_MAP = {
		'sundance': 'Sundance',
		'hot-spring': 'Hot Spring',
		'jacuzzi': 'Jacuzzi',
		'caldera': 'Caldera'
	};

	var CONDITION_MAP = {
		'new-inventory': 'New',
		'floor-model': 'Floor Model',
		'refurbished': 'Refurbished'
	};

	var SEATING_MAP = {
		'7-person': '7 Person',
		'8-person': '8 Person',
		'6-person': '6 Person',
		'5-person': '5 Person',
		'4-person': '4 Person'
	};

	var LOCATION_MAP = {
		'scottsdale-az': 'Scottsdale, AZ'
	};

	var cards = [];
	var totalCount = 0;

	function initCards() {
		cards = Array.prototype.slice.call(
			document.querySelectorAll('.mvl-card-skins[data-listing-id]')
		);
		totalCount = cards.length;
		cards.forEach(function (card, i) {
			card.dataset.index = String(i);
		});
	}

	function syncFilterExtents() {
		cards.forEach(function (card) {
			var price = parseInt(card.dataset.price, 10);
			var monthly = parseInt(card.dataset.monthly, 10);
			if (!isNaN(price) && price > PRICE_MAX) {
				PRICE_MAX = Math.ceil(price / 500) * 500;
			}
			if (!isNaN(monthly) && monthly > MONTHLY_MAX) {
				MONTHLY_MAX = Math.ceil(monthly / 25) * 25;
			}
		});

		var priceRange = document.querySelector('.stm-price-range');
		if (priceRange) {
			priceRange.dataset.max = String(PRICE_MAX);
		}
	}

	function getCheckedValues(name) {
		return Array.prototype.slice.call(
			document.querySelectorAll('.stm-inventory-pro-sidebar input[name="' + name + '"]:checked:not(:disabled)')
		).map(function (el) { return el.value; });
	}

	function getPriceRange() {
		var minEl = document.getElementById('stm_filter_min_price');
		var maxEl = document.getElementById('stm_filter_max_price');
		return {
			min: minEl && minEl.value ? parseInt(minEl.value, 10) : PRICE_MIN,
			max: maxEl && maxEl.value ? parseInt(maxEl.value, 10) : PRICE_MAX
		};
	}

	function getMonthlyRange() {
		var minEl = document.getElementById('stm_filter_min_mgc_monthly_payment');
		var maxEl = document.getElementById('stm_filter_max_mgc_monthly_payment');
		return {
			min: minEl && minEl.value ? parseInt(minEl.value, 10) : MONTHLY_MIN,
			max: maxEl && maxEl.value ? parseInt(maxEl.value, 10) : MONTHLY_MAX
		};
	}

	function getKeyword() {
		var inputs = document.querySelectorAll('input[name="stm_keywords"]');
		var val = '';
		inputs.forEach(function (el) {
			if (el.value.trim()) val = el.value.trim().toLowerCase();
		});
		return val;
	}

	function cardMatches(card) {
		var price = parseInt(card.dataset.price, 10);
		var monthly = parseInt(card.dataset.monthly, 10);
		var year = parseInt(card.dataset.year, 10);
		var title = (card.dataset.title || '').toLowerCase();
		var priceRange = getPriceRange();
		var monthlyRange = getMonthlyRange();
		var keyword = getKeyword();

		if (keyword && title.indexOf(keyword) === -1) return false;
		if (price < priceRange.min || price > priceRange.max) return false;
		if (monthly < monthlyRange.min || monthly > monthlyRange.max) return false;

		var conditions = getCheckedValues('condition[]');
		if (conditions.length && conditions.indexOf(card.dataset.conditionKey) === -1) return false;

		var power = getCheckedValues('power-type[]');
		if (power.length && power.indexOf(card.dataset.powerKey) === -1) return false;

		var makes = getCheckedValues('make[]');
		if (makes.length && makes.indexOf(card.dataset.makeKey) === -1) return false;

		var seating = getCheckedValues('seating[]');
		if (seating.length && seating.indexOf(card.dataset.seatingKey) === -1) return false;

		var locations = getCheckedValues('locations[]');
		if (locations.length && locations.indexOf(card.dataset.locationKey) === -1) return false;

		return true;
	}

	function getSortMode() {
		var sel = document.querySelector('select[name="sort_order"]');
		return sel ? sel.value : 'date_high';
	}

	function sortCards(visible) {
		var mode = getSortMode();
		visible.sort(function (a, b) {
			var ai = parseInt(a.dataset.index, 10);
			var bi = parseInt(b.dataset.index, 10);
			var ap = parseInt(a.dataset.price, 10);
			var bp = parseInt(b.dataset.price, 10);
			var ay = parseInt(a.dataset.year, 10);
			var by = parseInt(b.dataset.year, 10);
			switch (mode) {
				case 'price_high': return bp - ap;
				case 'price_low': return ap - bp;
				case 'ca-year_high': return by - ay;
				case 'ca-year_low': return ay - by;
				case 'date_low': return bi - ai;
				default: return ai - bi;
			}
		});
	}

	function updateTags() {
		var list = document.querySelector('.stm-filter-chosen-units-list');
		if (!list) return;
		list.innerHTML = '';

		function addTag(label, clearFn) {
			var li = document.createElement('li');
			li.textContent = label + ' ';
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.setAttribute('aria-label', 'Remove ' + label);
			btn.textContent = '×';
			btn.addEventListener('click', clearFn);
			li.appendChild(btn);
			list.appendChild(li);
		}

		var kw = getKeyword();
		if (kw) {
			addTag('Search: ' + kw, function () {
				document.querySelectorAll('input[name="stm_keywords"]').forEach(function (el) { el.value = ''; });
				applyFilters();
			});
		}

		var pr = getPriceRange();
		if (pr.min > PRICE_MIN || pr.max < PRICE_MAX) {
			addTag('$' + pr.min.toLocaleString() + ' – $' + pr.max.toLocaleString(), function () {
				resetPriceSlider();
				applyFilters();
			});
		}

		var mr = getMonthlyRange();
		if (mr.min > MONTHLY_MIN || mr.max < MONTHLY_MAX) {
			addTag('$' + mr.min + '/mo – $' + mr.max + '/mo', function () {
				resetMonthlySlider();
				applyFilters();
			});
		}

		document.querySelectorAll('.stm-inventory-pro-sidebar input[type="checkbox"]:checked').forEach(function (cb) {
			var badge = cb.closest('label');
			var label = badge ? badge.querySelector('.option-badge') : null;
			var text = label ? label.textContent.trim() : cb.value;
			addTag(text, function () {
				cb.checked = false;
				cb.closest('label') && cb.closest('label').classList.remove('checked');
				applyFilters();
			});
		});
	}

	function updateCount(visible) {
		var countEl = document.querySelector('.mvl-total-count');
		if (countEl) countEl.textContent = String(visible.length);
	}

	function applyFilters() {
		var track = document.querySelector('.stm-isotope-sorting');
		var empty = document.querySelector('.mgc-inventory-empty');
		var visible = cards.filter(cardMatches);
		sortCards(visible);

		cards.forEach(function (card) {
			card.classList.add('is-filtered-out');
		});
		visible.forEach(function (card) {
			card.classList.remove('is-filtered-out');
			if (track) track.appendChild(card);
		});

		if (empty) {
			empty.classList.toggle('is-visible', visible.length === 0);
		}
		updateCount(visible);
		updateTags();
		updateCheckboxStates();
	}

	function updateCheckboxStates() {
		document.querySelectorAll('.stm-inventory-pro-sidebar input[type="checkbox"]').forEach(function (cb) {
			var label = cb.closest('label');
			if (!label || label.classList.contains('disabled')) return;

			var name = cb.name;
			var val = cb.value;
			var hasMatch = cards.some(function (card) {
				if (name === 'condition[]') return card.dataset.conditionKey === val;
				if (name === 'power-type[]') return card.dataset.powerKey === val;
				if (name === 'make[]') return card.dataset.makeKey === val;
				if (name === 'seating[]') return card.dataset.seatingKey === val;
				if (name === 'locations[]') return card.dataset.locationKey === val;
				return false;
			});

			if (!hasMatch && !cb.checked) {
				label.classList.add('disabled');
				cb.disabled = true;
			} else if (!cb.checked) {
				label.classList.remove('disabled');
				cb.disabled = false;
			}
		});
	}

	function buildRangeSlider(container, opts) {
		if (!container || container.dataset.mgcBuilt) return;
		container.dataset.mgcBuilt = '1';

		var min = opts.min;
		var max = opts.max;
		var minInput = opts.minInput;
		var maxInput = opts.maxInput;
		var step = opts.step || 1;

		var wrap = document.createElement('div');
		wrap.className = 'mgc-range-slider';

		var track = document.createElement('div');
		track.className = 'mgc-range-slider__track';

		var rangeMin = document.createElement('input');
		rangeMin.type = 'range';
		rangeMin.min = min;
		rangeMin.max = max;
		rangeMin.step = step;
		rangeMin.value = min;

		var rangeMax = document.createElement('input');
		rangeMax.type = 'range';
		rangeMax.min = min;
		rangeMax.max = max;
		rangeMax.step = step;
		rangeMax.value = max;

		function sync() {
			var lo = Math.min(parseInt(rangeMin.value, 10), parseInt(rangeMax.value, 10));
			var hi = Math.max(parseInt(rangeMin.value, 10), parseInt(rangeMax.value, 10));
			rangeMin.value = lo;
			rangeMax.value = hi;
			if (minInput && opts.writeInputs !== false) minInput.value = lo;
			if (maxInput && opts.writeInputs !== false) maxInput.value = hi;
			else if (minInput && lo > min) minInput.value = lo;
			else if (maxInput && hi < max) maxInput.value = hi;
			var pctLo = ((lo - min) / (max - min)) * 100;
			var pctHi = ((hi - min) / (max - min)) * 100;
			track.style.left = pctLo + '%';
			track.style.width = (pctHi - pctLo) + '%';
		}

		function onChange() {
			sync();
			applyFilters();
		}

		rangeMin.addEventListener('input', onChange);
		rangeMax.addEventListener('input', onChange);

		if (minInput) {
			minInput.addEventListener('change', function () {
				rangeMin.value = minInput.value || min;
				onChange();
			});
		}
		if (maxInput) {
			maxInput.addEventListener('change', function () {
				rangeMax.value = maxInput.value || max;
				onChange();
			});
		}

		wrap.appendChild(track);
		wrap.appendChild(rangeMin);
		wrap.appendChild(rangeMax);
		container.appendChild(wrap);
		sync();
	}

	function resetPriceSlider() {
		var minInput = document.getElementById('stm_filter_min_price');
		var maxInput = document.getElementById('stm_filter_max_price');
		if (minInput) minInput.value = PRICE_MIN;
		if (maxInput) maxInput.value = PRICE_MAX;
		var container = document.querySelector('.stm-price-range');
		if (container) {
			delete container.dataset.mgcBuilt;
			container.innerHTML = '';
			buildRangeSlider(container, { min: PRICE_MIN, max: PRICE_MAX, minInput: minInput, maxInput: maxInput, step: 100 });
		}
	}

	function resetMonthlySlider() {
		var minInput = document.getElementById('stm_filter_min_mgc_monthly_payment');
		var maxInput = document.getElementById('stm_filter_max_mgc_monthly_payment');
		if (minInput) minInput.value = '';
		if (maxInput) maxInput.value = '';
		var container = document.querySelector('.stm-mgc_monthly_payment-range');
		if (container) {
			delete container.dataset.mgcBuilt;
			container.innerHTML = '';
			buildRangeSlider(container, { min: MONTHLY_MIN, max: MONTHLY_MAX, minInput: minInput, maxInput: maxInput, step: 5 });
		}
	}

	function resetAll() {
		document.querySelectorAll('.stm-inventory-pro-sidebar input[type="checkbox"]').forEach(function (cb) {
			cb.checked = false;
			var label = cb.closest('label');
			if (label) label.classList.remove('checked');
		});
		document.querySelectorAll('input[name="stm_keywords"]').forEach(function (el) { el.value = ''; });
		var sort = document.querySelector('select[name="sort_order"]');
		if (sort) sort.value = 'date_high';
		resetPriceSlider();
		resetMonthlySlider();
		applyFilters();
	}

	function initSliders() {
		var priceContainer = document.querySelector('.stm-price-range');
		var minPrice = document.getElementById('stm_filter_min_price');
		var maxPrice = document.getElementById('stm_filter_max_price');
		if (minPrice) minPrice.value = PRICE_MIN;
		if (maxPrice) maxPrice.value = PRICE_MAX;
		buildRangeSlider(priceContainer, {
			min: PRICE_MIN, max: PRICE_MAX,
			minInput: minPrice, maxInput: maxPrice, step: 100
		});

		var monthlyContainer = document.querySelector('.stm-mgc_monthly_payment-range');
		var minMonthly = document.getElementById('stm_filter_min_mgc_monthly_payment');
		var maxMonthly = document.getElementById('stm_filter_max_mgc_monthly_payment');
		buildRangeSlider(monthlyContainer, {
			min: MONTHLY_MIN, max: MONTHLY_MAX,
			minInput: minMonthly, maxInput: maxMonthly, step: 5,
			writeInputs: false
		});
	}

	function initEvents() {
		document.querySelectorAll('.stm-inventory-pro-sidebar input[type="checkbox"]').forEach(function (cb) {
			cb.addEventListener('change', function () {
				var label = cb.closest('label');
				if (label) label.classList.toggle('checked', cb.checked);
				applyFilters();
			});
		});

		document.querySelectorAll('input[name="stm_keywords"]').forEach(function (el) {
			var t;
			el.addEventListener('input', function () {
				clearTimeout(t);
				t = setTimeout(applyFilters, 300);
			});
		});

		var sort = document.querySelector('select[name="sort_order"]');
		if (sort) sort.addEventListener('change', applyFilters);

		document.querySelectorAll('.search-results-actions-reset-all a, .stm-inventory-pro-filter-footer .action-reset, .stm-filter-pro-item-heading .action-reset').forEach(function (el) {
			el.addEventListener('click', function (e) {
				e.preventDefault();
				resetAll();
			});
		});

		var resetBtn = document.querySelector('.stm-inventory-pro-filter-footer button, .stm-inventory-pro-filter-footer .reset-all');
		if (resetBtn) resetBtn.addEventListener('click', function (e) { e.preventDefault(); resetAll(); });

		document.querySelectorAll('.show-all').forEach(function (el) {
			el.addEventListener('click', function () {
				var parent = el.closest('.stm-filter-pro-item-content');
				if (parent) parent.classList.add('is-expanded');
			});
		});
		document.querySelectorAll('.show-less').forEach(function (el) {
			el.addEventListener('click', function () {
				var parent = el.closest('.stm-filter-pro-item-content');
				if (parent) parent.classList.remove('is-expanded');
			});
		});

		var filterHandle = document.querySelector('.filter-handle');
		var sidebar = document.querySelector('.stm-inventory-pro-sidebar');
		if (filterHandle && sidebar) {
			filterHandle.addEventListener('click', function () {
				sidebar.classList.toggle('is-open');
				document.body.classList.toggle('mgc-filter-open');
			});
		}

		document.querySelectorAll('.stm-view-by .view-type').forEach(function (btn) {
			btn.addEventListener('click', function (e) {
				e.preventDefault();
				document.querySelectorAll('.stm-view-by .view-type').forEach(function (b) { b.classList.remove('active'); });
				btn.classList.add('active');
			});
		});

		document.querySelectorAll('.interactive-hoverable').forEach(function (gallery) {
			var units = gallery.querySelectorAll('.hoverable-unit');
			var indicators = gallery.querySelectorAll('.hoverable-indicators .indicator');
			units.forEach(function (unit, i) {
				unit.addEventListener('mouseenter', function () {
					units.forEach(function (u) { u.classList.remove('active'); });
					indicators.forEach(function (d) { d.classList.remove('active'); });
					unit.classList.add('active');
					if (indicators[i]) indicators[i].classList.add('active');
				});
			});
		});
	}

	function addEmptyState() {
		var track = document.querySelector('.stm-isotope-sorting');
		if (!track || document.querySelector('.mgc-inventory-empty')) return;
		var empty = document.createElement('div');
		empty.className = 'mgc-inventory-empty';
		empty.innerHTML = '<p>No hot tubs match your filters. Try adjusting your search or <a href="#" class="mgc-reset-link">reset all filters</a>.</p>';
		track.parentNode.insertBefore(empty, track.nextSibling);
		empty.querySelector('.mgc-reset-link').addEventListener('click', function (e) {
			e.preventDefault();
			resetAll();
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		initCards();
		syncFilterExtents();
		initSliders();
		initEvents();
		addEmptyState();
		updateCheckboxStates();
		applyFilters();
	});
})();