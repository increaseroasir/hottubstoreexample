(function () {
	'use strict';

	var QUOTE_PARAM = 'quote';
	var QUOTE_VALUE = 'open';
	var modal = null;

	function getProductMeta(modalEl) {
		var titleEl = document.querySelector('.ps-listing-title, h1.title');
		var name = modalEl.getAttribute('data-product-name') || '';

		if (titleEl) {
			var lineEl = titleEl.querySelector('.ps-listing-title__line');
			var modelEl = titleEl.querySelector('.ps-listing-title__model');
			if (lineEl || modelEl) {
				name = ((lineEl && lineEl.textContent.trim()) + ' ' + (modelEl && modelEl.textContent.trim())).trim();
			} else if (titleEl.textContent.trim()) {
				name = titleEl.textContent.trim();
			}
		}

		if (!name) {
			name = document.title.split('|')[0].trim();
		}

		var productId = modalEl.getAttribute('data-product-id') || '';
		if (!productId) {
			var idMatch = document.body.className.match(/postid-(\d+)/);
			if (idMatch) productId = idMatch[1];
		}

		var productSku = modalEl.getAttribute('data-product-sku') || '';
		if (!productSku) {
			var items = document.querySelectorAll('.stm-single-car-listing-data .data-list-item');
			for (var i = 0; i < items.length; i++) {
				var label = items[i].querySelector('.item-label');
				if (label && /stock\s*id/i.test(label.textContent)) {
					var val = items[i].querySelector('.heading-font');
					if (val) productSku = val.textContent.trim();
					break;
				}
			}
		}

		return {
			name: name,
			id: productId,
			sku: productSku,
			url: window.location.origin + window.location.pathname
		};
	}

	function consumeQuoteOpenParam() {
		var params = new URLSearchParams(window.location.search);
		if (params.get(QUOTE_PARAM) !== QUOTE_VALUE) return false;

		params.delete(QUOTE_PARAM);
		var qs = params.toString();
		var next = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
		window.history.replaceState(null, '', next);
		return true;
	}

	function getFocusables(container) {
		return Array.prototype.slice.call(
			container.querySelectorAll(
				'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter(function (el) {
			return !el.hidden && el.getAttribute('aria-hidden') !== 'true';
		});
	}

	function mountModal(modalEl) {
		if (modalEl.parentElement !== document.documentElement) {
			document.documentElement.appendChild(modalEl);
		}
	}

	function setModalOpenState(isOpen) {
		if (!modal) return;
		modal.classList.toggle('is-open', isOpen);
		modal.hidden = !isOpen;
		modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
		document.documentElement.classList.toggle('ps-quote-modal-open', isOpen);
		document.body.classList.toggle('ps-quote-modal-open', isOpen);
	}

	function isModalOpen() {
		return modal && modal.classList.contains('is-open');
	}

	function init() {
		modal = document.getElementById('ps-install-price-modal');
		if (!modal || modal.dataset.psQuoteReady === '1') return;
		modal.dataset.psQuoteReady = '1';

		mountModal(modal);

		var form = modal.querySelector('.ps-quote-modal__form');
		var success = modal.querySelector('.ps-quote-modal__success');
		var productLine = modal.querySelector('[data-ps-quote-product-name]');
		var openSelector = '[data-ps-open-quote], a.mgc-cta-btn--primary[href="#trade-offer"], a.mgc-cta-btn--primary[href="#get-a-quote"], a.ps-h-estimate[href="#get-a-quote"]';
		var lastFocused = null;

		function syncProductMeta() {
			var meta = getProductMeta(modal);
			if (productLine) productLine.textContent = meta.name;

			var map = {
				product_name: meta.name,
				product_id: meta.id,
				product_sku: meta.sku,
				page_url: meta.url
			};

			Object.keys(map).forEach(function (key) {
				var input = form && form.querySelector('[data-ps-quote-field="' + key + '"]');
				if (input) input.value = map[key] || '';
			});
		}

		function openModal() {
			lastFocused = document.activeElement;
			syncProductMeta();
			setModalOpenState(true);
			var first = modal.querySelector('.ps-quote-modal__input:not([type="hidden"])');
			if (first) {
				window.requestAnimationFrame(function () {
					first.focus();
				});
			}
		}

		function closeModal(e) {
			if (e && typeof e.preventDefault === 'function') {
				e.preventDefault();
			}
			if (e && typeof e.stopPropagation === 'function') {
				e.stopPropagation();
			}
			setModalOpenState(false);
			if (lastFocused && typeof lastFocused.focus === 'function') {
				lastFocused.focus();
			}
		}

		window.psCloseQuoteModal = closeModal;
		window.psOpenQuoteModal = openModal;

		function resetForm() {
			if (form) {
				form.hidden = false;
				form.reset();
				syncProductMeta();
			}
			if (success) success.hidden = true;
		}

		function bindCloseEl(el) {
			function onClose(e) {
				e.preventDefault();
				e.stopPropagation();
				closeModal(e);
			}
			el.addEventListener('mousedown', onClose);
			el.addEventListener('click', onClose);
			el.addEventListener('touchend', onClose, { passive: false });
		}

		document.addEventListener('click', function (e) {
			var opener = e.target.closest && e.target.closest(openSelector);
			if (!opener) return;
			if (opener.closest('#ps-install-price-modal')) return;
			e.preventDefault();
			e.stopPropagation();
			resetForm();
			openModal();
		}, true);

		document.addEventListener('mousedown', function (e) {
			if (!isModalOpen()) return;
			var closeEl = e.target.closest && e.target.closest('[data-ps-quote-close]');
			if (!closeEl || !modal.contains(closeEl)) return;
			e.preventDefault();
			e.stopPropagation();
			closeModal(e);
		}, true);

		modal.querySelectorAll('[data-ps-quote-close]').forEach(bindCloseEl);

		document.addEventListener('keydown', function (e) {
			if (!isModalOpen()) return;

			if (e.key === 'Escape') {
				e.preventDefault();
				closeModal(e);
				return;
			}

			if (e.key !== 'Tab') return;

			var focusables = getFocusables(modal);
			if (!focusables.length) return;

			var first = focusables[0];
			var last = focusables[focusables.length - 1];

			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		});

		if (form) {
			form.addEventListener('submit', function (e) {
				e.preventDefault();
				syncProductMeta();
				form.hidden = true;
				if (success) success.hidden = false;
			});
		}

		function checkAutoOpen() {
			var shouldOpen = consumeQuoteOpenParam() || window.location.hash === '#get-a-quote';
			if (!shouldOpen) return;
			resetForm();
			openModal();
			if (window.location.hash === '#get-a-quote') {
				window.history.replaceState(null, '', window.location.pathname + window.location.search);
			}
		}

		syncProductMeta();
		checkAutoOpen();
		window.addEventListener('hashchange', checkAutoOpen);
	}

	if (document.getElementById('ps-install-price-modal')) {
		init();
	} else {
		document.addEventListener('DOMContentLoaded', init);
	}
})();