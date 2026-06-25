(function () {
	'use strict';

	var drawer = document.getElementById('ps-drawer');
	var toggle = document.querySelector('.ps-menu-toggle');
	var closeBtn = document.querySelector('.ps-drawer__close');
	var backdrop = document.querySelector('.ps-drawer__backdrop');
	var mobileMenuBtn = document.querySelector('[data-ps-open-menu]');

	function openDrawer() {
		if (!drawer) return;
		drawer.setAttribute('aria-hidden', 'false');
		document.body.classList.add('ps-menu-open');
		if (toggle) toggle.setAttribute('aria-expanded', 'true');
	}

	function closeDrawer() {
		if (!drawer) return;
		drawer.setAttribute('aria-hidden', 'true');
		document.body.classList.remove('ps-menu-open');
		if (toggle) toggle.setAttribute('aria-expanded', 'false');
	}

	if (toggle) {
		toggle.addEventListener('click', function () {
			var open = drawer && drawer.getAttribute('aria-hidden') === 'false';
			if (open) closeDrawer();
			else openDrawer();
		});
	}

	if (mobileMenuBtn) {
		mobileMenuBtn.addEventListener('click', openDrawer);
	}

	if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
	if (backdrop) backdrop.addEventListener('click', closeDrawer);

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') closeDrawer();
	});

	var hansonsHeader = document.querySelector('.ps-site-header--hansons');
	if (hansonsHeader) {
		var utilityBar = hansonsHeader.querySelector('.ps-h-utility');
		var utilityOffset = 1;

		function measureUtilityOffset() {
			if (!utilityBar || window.getComputedStyle(utilityBar).display === 'none') {
				utilityOffset = 1;
				return;
			}
			var height = utilityBar.getBoundingClientRect().height;
			if (height > 0) utilityOffset = height;
		}

		function updateHansonsHeaderScroll() {
			document.body.classList.toggle('ps-header-scrolled', window.scrollY >= utilityOffset);
		}

		measureUtilityOffset();
		updateHansonsHeaderScroll();
		window.addEventListener('scroll', updateHansonsHeaderScroll, { passive: true });
		window.addEventListener('resize', function () {
			measureUtilityOffset();
			updateHansonsHeaderScroll();
		}, { passive: true });
	} else {
		var siteHeader = document.querySelector('.ps-site-header') || document.querySelector('.ps-funnel-header');
		if (siteHeader) {
			function updateHeaderScroll() {
				siteHeader.classList.toggle('is-scrolled', window.scrollY > 2);
			}
			updateHeaderScroll();
			window.addEventListener('scroll', updateHeaderScroll, { passive: true });
		}
	}

	var desktopNavTriggers = document.querySelectorAll('.ps-desktop-nav__trigger');
	desktopNavTriggers.forEach(function (trigger) {
		var parent = trigger.closest('.ps-desktop-nav__item--has-menu');
		if (!parent) return;

		trigger.addEventListener('click', function () {
			var open = parent.classList.contains('is-open');
			desktopNavTriggers.forEach(function (other) {
				var otherParent = other.closest('.ps-desktop-nav__item--has-menu');
				if (otherParent) {
					otherParent.classList.remove('is-open');
					other.setAttribute('aria-expanded', 'false');
				}
			});
			if (!open) {
				parent.classList.add('is-open');
				trigger.setAttribute('aria-expanded', 'true');
			}
		});
	});

	document.addEventListener('click', function (e) {
		if (!e.target.closest('.ps-desktop-nav__item--has-menu')) {
			desktopNavTriggers.forEach(function (trigger) {
				var parent = trigger.closest('.ps-desktop-nav__item--has-menu');
				if (parent) parent.classList.remove('is-open');
				trigger.setAttribute('aria-expanded', 'false');
			});
		}
	});
})();