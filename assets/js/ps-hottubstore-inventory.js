(function () {
	'use strict';

	var MAX_BADGES = 3;

	function markThumbPlaceholder(thumb) {
		if (!thumb || thumb.classList.contains('ps-thumb-placeholder')) {
			return;
		}

		thumb.classList.add('ps-thumb-placeholder');

		if (thumb.querySelector('.ps-thumb-placeholder__inner')) {
			return;
		}

		var inner = document.createElement('div');
		inner.className = 'ps-thumb-placeholder__inner';
		inner.setAttribute('aria-hidden', 'true');
		inner.innerHTML =
			'<i class="motors-icons-photoaparat ps-thumb-placeholder__icon" aria-hidden="true"></i>' +
			'<span class="ps-thumb-placeholder__title">Photo Coming Soon</span>' +
			'<span class="ps-thumb-placeholder__sub">Contact us for current photos</span>';
		thumb.appendChild(inner);
	}

	function handleProductImage(img) {
		if (!img || !img.closest('.listing-list-loop')) {
			return;
		}

		var src = (img.getAttribute('src') || '').trim();
		var thumb = img.closest('.thumb');

		if (img.hasAttribute('data-ps-placeholder') || !src || src.indexOf('unsplash.com') !== -1) {
			img.removeAttribute('src');
			img.classList.add('ps-card-img--missing');
			if (thumb) {
				markThumbPlaceholder(thumb);
			}
			return;
		}

		if (img.classList.contains('ps-card-img--missing')) {
			if (thumb) {
				markThumbPlaceholder(thumb);
			}
			return;
		}

		img.addEventListener('error', function onImageError() {
			img.removeEventListener('error', onImageError);
			img.removeAttribute('src');
			img.classList.add('ps-card-img--missing');
			if (thumb) {
				markThumbPlaceholder(thumb);
			}
		});
	}

	function hasSalePrice(card) {
		return !!card.querySelector('.mvl-price.has-sale-price, .mvl-normal-price.has-sale-price');
	}

	function hasCustomPricingCTA(card) {
		return !!card.querySelector('.mgc-quote-link');
	}

	function hasFinancing(card) {
		var monthly = card.getAttribute('data-monthly');
		return monthly && parseInt(monthly, 10) > 0;
	}

	function conditionBadge(card) {
		var key = card.getAttribute('data-condition-key') || '';

		if (key === 'new-inventory') {
			return { className: 'ps-card-badge--new', text: 'New' };
		}
		if (key === 'floor-model') {
			return { className: 'ps-card-badge--condition', text: 'Floor Model' };
		}
		if (key === 'refurbished') {
			return { className: 'ps-card-badge--condition', text: 'Refurbished' };
		}

		return null;
	}

	function createBadge(className, text) {
		var badge = document.createElement('span');
		badge.className = 'ps-card-badge ' + className;
		badge.textContent = text;
		return badge;
	}

	function addCardBadges(card) {
		var imageWrap = card.querySelector('.skin_1.image');
		if (!imageWrap || imageWrap.querySelector('.ps-card-badges')) {
			return;
		}

		var candidates = [];

		if (hasSalePrice(card)) {
			candidates.push(createBadge('ps-card-badge--sale', 'Sale'));
		}

		var condition = conditionBadge(card);
		if (condition) {
			candidates.push(createBadge(condition.className, condition.text));
		}

		if (hasFinancing(card)) {
			candidates.push(createBadge('ps-card-badge--finance', 'Financing'));
		}

		if (hasCustomPricingCTA(card)) {
			candidates.push(createBadge('ps-card-badge--custom', 'Custom Pricing'));
		}

		if (!candidates.length) {
			return;
		}

		var badges = document.createElement('div');
		badges.className = 'ps-card-badges';
		badges.setAttribute('aria-hidden', 'true');

		candidates.slice(0, MAX_BADGES).forEach(function (badge) {
			badges.appendChild(badge);
		});

		imageWrap.appendChild(badges);
	}

	function addTrustMicrocopy(inner) {
		if (inner.querySelector('.ps-card-trust')) {
			return;
		}

		var primary = inner.querySelector('.mgc-quote-link');
		if (!primary) {
			return;
		}

		var trust = document.createElement('p');
		trust.className = 'ps-card-trust';
		trust.innerHTML =
			'Local Delivery <span aria-hidden="true">&bull;</span> Installation Support <span aria-hidden="true">&bull;</span> Financing Available';
		primary.insertAdjacentElement('afterend', trust);
	}

	function addSecondaryCTAs(card) {
		var inner = card.querySelector('.mvl-action-buttons-inner');
		if (!inner || inner.querySelector('.ps-card-cta-row')) {
			return;
		}

		var detailLink = card.querySelector('a.skin-list-gallery[href]');
		var detailHref = detailLink ? detailLink.getAttribute('href') : '';
		if (detailHref === '#') {
			detailHref = '';
		}

		var row = document.createElement('div');
		row.className = 'ps-card-cta-row';

		var coupon = document.createElement('a');
		coupon.className = 'ps-card-secondary-cta ps-card-secondary-cta--coupon';
		coupon.href = '/hottubstore/survey.html';
		coupon.textContent = 'Claim Coupon';
		row.appendChild(coupon);

		if (detailHref) {
			var details = document.createElement('a');
			details.className = 'ps-card-secondary-cta ps-card-secondary-cta--details';
			details.href = detailHref;
			details.textContent = 'View Details';
			row.appendChild(details);
		}

		inner.appendChild(row);
	}

	function closeFilterPanel() {
		var sidebar = document.querySelector('.stm-inventory-pro-sidebar');
		if (!sidebar) {
			return;
		}
		sidebar.classList.remove('is-open');
		document.body.classList.remove('mgc-filter-open');
	}

	function initFilterSidebarMobile() {
		var sidebar = document.querySelector('.stm-inventory-pro-sidebar');
		if (!sidebar) {
			return;
		}

		var closeBtn = sidebar.querySelector('.filter-close');
		if (closeBtn) {
			closeBtn.addEventListener('click', closeFilterPanel);
		}

		document.addEventListener('click', function (event) {
			if (!document.body.classList.contains('mgc-filter-open')) {
				return;
			}
			if (event.target.closest('.stm-inventory-pro-sidebar') || event.target.closest('.filter-handle')) {
				return;
			}
			closeFilterPanel();
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && document.body.classList.contains('mgc-filter-open')) {
				closeFilterPanel();
			}
		});
	}

	function enhanceInventoryCards() {
		document.querySelectorAll('.listing-list-loop.mvl-list-card-skin').forEach(function (card) {
			card.querySelectorAll('.thumb img').forEach(handleProductImage);
			addCardBadges(card);

			var inner = card.querySelector('.mvl-action-buttons-inner');
			if (inner) {
				addTrustMicrocopy(inner);
				addSecondaryCTAs(card);
			}
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () {
			enhanceInventoryCards();
			initFilterSidebarMobile();
		});
	} else {
		enhanceInventoryCards();
		initFilterSidebarMobile();
	}
})();