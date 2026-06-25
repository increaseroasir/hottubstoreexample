( function () {
	var reviews = window.MGC_REVIEWS;
	var assetBase = window.MGC_REVIEWS_ASSET_BASE || 'assets/';
	var track = document.getElementById( 'mgcReviewsTrack' );
	var dotsWrap = document.getElementById( 'mgcRevDots' );
	var prevBtn = document.getElementById( 'mgcRevPrev' );
	var nextBtn = document.getElementById( 'mgcRevNext' );
	var modal = document.getElementById( 'mgcReviewsModal' );
	if ( ! reviews || ! track || ! dotsWrap || ! prevBtn || ! nextBtn || ! modal ) return;

	var GOOGLE_ICON = '<svg class="mgc-hp-reviews__google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>';
	var STAR_ROW = '&#9733;&#9733;&#9733;&#9733;&#9733;';
	var cards = [];
	var current = 0;
	var cardW = 0;
	var gap = 36;
	var lastFocus = null;

	function slugify( name ) {
		return name.toLowerCase().replace( /\s+/g, '-' );
	}

	function firstInitial( review ) {
		var source = review.initials || review.name || '?';
		return source.charAt( 0 ).toUpperCase();
	}

	function buildGoogleMark() {
		return '<span class="mgc-hp-reviews__google-mark" aria-label="Google review">' + GOOGLE_ICON + '</span>';
	}

	function buildAvatar( review ) {
		var slug = slugify( review.name );
		var src = assetBase + 'images/reviews/' + slug + '.jpg';
		return (
			'<div class="mgc-hp-reviews__avatar" aria-hidden="true">' +
				'<img class="mgc-hp-reviews__avatar-img" src="' + src + '" alt="" width="40" height="40" loading="lazy" hidden>' +
				'<span class="mgc-hp-reviews__avatar-initials">' + firstInitial( review ) + '</span>' +
			'</div>'
		);
	}

	function buildAuthor( review ) {
		var timeHtml = review.time ? '<span>' + review.time + '</span>' : '';
		return (
			'<div class="mgc-hp-reviews__author">' +
				buildAvatar( review ) +
				'<div class="mgc-hp-reviews__author-info"><strong>' + review.name + '</strong>' + timeHtml + '</div>' +
			'</div>'
		);
	}

	function buildCard( review, index ) {
		var tone = index % 3;
		return (
			'<article class="mgc-hp-reviews__card" data-review-index="' + index + '" data-avatar-tone="' + tone + '">' +
				buildGoogleMark() +
				'<div class="mgc-hp-reviews__card-head">' +
					buildAuthor( review ) +
				'</div>' +
				'<div class="mgc-hp-reviews__stars" aria-label="5 out of 5 stars">' + STAR_ROW + '</div>' +
				'<div class="mgc-hp-reviews__body">' +
					'<blockquote class="mgc-hp-reviews__quote"></blockquote>' +
					'<button type="button" class="mgc-hp-reviews__more" hidden>Read more</button>' +
				'</div>' +
			'</article>'
		);
	}

	function wireAvatar( card, review ) {
		var img = card.querySelector( '.mgc-hp-reviews__avatar-img' );
		var initials = card.querySelector( '.mgc-hp-reviews__avatar-initials' );
		if ( ! img || ! initials ) return;

		img.addEventListener( 'load', function () {
			if ( img.naturalWidth > 0 ) {
				img.hidden = false;
				initials.hidden = true;
			}
		} );
		img.addEventListener( 'error', function () {
			img.hidden = true;
			initials.hidden = false;
		} );
		if ( img.complete && img.naturalWidth > 0 ) {
			img.hidden = false;
			initials.hidden = true;
		}
	}

	function quoteOverflows( quote ) {
		return quote.scrollHeight > quote.clientHeight + 2;
	}

	function setupQuote( card, review, index ) {
		var quote = card.querySelector( '.mgc-hp-reviews__quote' );
		var moreBtn = card.querySelector( '.mgc-hp-reviews__more' );
		if ( ! quote || ! moreBtn ) return;

		quote.textContent = review.text;
		moreBtn.addEventListener( 'click', function () {
			openModal( index );
		} );
	}

	function updateSeeMoreButtons() {
		cards.forEach( function ( card ) {
			var quote = card.querySelector( '.mgc-hp-reviews__quote' );
			var moreBtn = card.querySelector( '.mgc-hp-reviews__more' );
			if ( ! quote || ! moreBtn ) return;
			moreBtn.hidden = ! quoteOverflows( quote );
		} );
	}

	function renderCards() {
		track.innerHTML = reviews.map( buildCard ).join( '' );
		cards = Array.prototype.slice.call( track.querySelectorAll( '.mgc-hp-reviews__card' ) );
		cards.forEach( function ( card, i ) {
			wireAvatar( card, reviews[i] );
			setupQuote( card, reviews[i], i );
			card.style.touchAction = 'pan-y';
		} );
	}

	function perView() {
		return window.innerWidth >= 900 ? 3 : window.innerWidth >= 580 ? 2 : 1;
	}

	function maxIdx() {
		return Math.max( 0, cards.length - perView() );
	}

	function setWidths() {
		var viewport = track.parentElement;
		var vw = viewport ? viewport.clientWidth : track.offsetWidth;
		if ( viewport ) {
			var style = window.getComputedStyle( viewport );
			vw -= parseFloat( style.paddingLeft ) + parseFloat( style.paddingRight );
		}
		var pv = perView();
		cardW = ( vw - gap * ( pv - 1 ) ) / pv;
		cards.forEach( function ( c ) { c.style.width = cardW + 'px'; } );
	}

	function buildDots() {
		dotsWrap.innerHTML = '';
		var max = maxIdx();
		for ( var i = 0; i <= max; i++ ) {
			var btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className = 'mgc-hp-reviews__dot' + ( i === current ? ' is-active' : '' );
			btn.setAttribute( 'aria-label', 'Go to review ' + ( i + 1 ) );
			btn.dataset.i = i;
			btn.addEventListener( 'click', function () { goTo( +this.dataset.i ); } );
			dotsWrap.appendChild( btn );
		}
	}

	function updateCardStates() {
		var pv = perView();
		cards.forEach( function ( card ) {
			card.classList.remove( 'is-center', 'is-side', 'is-visible' );
		} );
		for ( var j = 0; j < pv; j++ ) {
			var idx = current + j;
			if ( ! cards[idx] ) continue;
			cards[idx].classList.add( 'is-visible' );
			if ( pv >= 3 ) {
				if ( j === 1 ) cards[idx].classList.add( 'is-center' );
				else cards[idx].classList.add( 'is-side' );
			} else if ( pv === 2 ) {
				if ( j === 0 ) cards[idx].classList.add( 'is-center' );
				else cards[idx].classList.add( 'is-side' );
			} else {
				cards[idx].classList.add( 'is-center' );
			}
		}
	}

	function goTo( idx ) {
		current = Math.min( Math.max( idx, 0 ), maxIdx() );
		track.style.transform = 'translateX(-' + ( current * ( cardW + gap ) ) + 'px)';
		var dots = dotsWrap.querySelectorAll( '.mgc-hp-reviews__dot' );
		dots.forEach( function ( d, i ) { d.classList.toggle( 'is-active', i === current ); } );
		prevBtn.disabled = current === 0;
		nextBtn.disabled = current === maxIdx();
		updateCardStates();
	}

	function initCarousel() {
		setWidths();
		buildDots();
		goTo( current );
		updateSeeMoreButtons();
	}

	var modalPanel = modal.querySelector( '.mgc-hp-reviews__modal-panel' );
	var modalBody = modal.querySelector( '.mgc-hp-reviews__modal-body' );
	var modalClose = modal.querySelector( '.mgc-hp-reviews__modal-close' );
	var modalBackdrop = modal.querySelector( '.mgc-hp-reviews__modal-backdrop' );
	var modalTitleId = 'mgcReviewsModalTitle';

	function getFocusable( root ) {
		return Array.prototype.slice.call(
			root.querySelectorAll( 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])' )
		).filter( function ( el ) {
			return ! el.hidden && ! el.disabled && el.offsetParent !== null;
		} );
	}

	function openModal( index ) {
		var review = reviews[index];
		if ( ! review ) return;

		lastFocus = document.activeElement;
		modalBody.innerHTML =
			'<div class="mgc-hp-reviews__card" data-avatar-tone="' + ( index % 3 ) + '">' +
				buildGoogleMark() +
				'<div class="mgc-hp-reviews__card-head">' +
					buildAuthor( review ) +
				'</div>' +
				'<div class="mgc-hp-reviews__stars" aria-label="5 out of 5 stars">' + STAR_ROW + '</div>' +
				'<blockquote class="mgc-hp-reviews__quote mgc-hp-reviews__quote--full"></blockquote>' +
			'</div>';

		var quote = modalBody.querySelector( '.mgc-hp-reviews__quote' );
		if ( quote ) quote.textContent = review.text;

		wireAvatar( modalBody, review );

		modal.hidden = false;
		document.body.classList.add( 'mgc-reviews-modal-open' );
		modal.setAttribute( 'aria-labelledby', modalTitleId );
		modal.querySelector( '.mgc-hp-reviews__author-info strong' ).id = modalTitleId;

		modalClose.focus();

		modal.addEventListener( 'keydown', onModalKeydown );
	}

	function closeModal() {
		modal.hidden = true;
		document.body.classList.remove( 'mgc-reviews-modal-open' );
		modal.removeEventListener( 'keydown', onModalKeydown );
		modalBody.innerHTML = '';
		if ( lastFocus && lastFocus.focus ) lastFocus.focus();
		lastFocus = null;
	}

	function onModalKeydown( e ) {
		if ( e.key === 'Escape' ) {
			e.preventDefault();
			closeModal();
			return;
		}
		if ( e.key !== 'Tab' ) return;

		var focusables = getFocusable( modalPanel );
		if ( ! focusables.length ) return;

		var first = focusables[0];
		var last = focusables[focusables.length - 1 ];

		if ( e.shiftKey && document.activeElement === first ) {
			e.preventDefault();
			last.focus();
		} else if ( ! e.shiftKey && document.activeElement === last ) {
			e.preventDefault();
			first.focus();
		}
	}

	modalClose.addEventListener( 'click', closeModal );
	modalBackdrop.addEventListener( 'click', closeModal );

	track.style.touchAction = 'pan-y';

	prevBtn.addEventListener( 'click', function () { goTo( current - 1 ); } );
	nextBtn.addEventListener( 'click', function () { goTo( current + 1 ); } );

	var startX = 0, startY = 0, dragging = false, swiping = false;
	track.addEventListener( 'touchstart', function ( e ) {
		if ( e.touches.length !== 1 ) return;
		startX = e.touches[0].pageX;
		startY = e.touches[0].pageY;
		dragging = true;
		swiping = false;
		track.style.transition = 'none';
	}, { passive: true } );
	track.addEventListener( 'touchmove', function ( e ) {
		if ( ! dragging ) return;
		var dx = e.touches[0].pageX - startX;
		var dy = e.touches[0].pageY - startY;
		if ( ! swiping ) {
			if ( Math.abs( dx ) < 8 && Math.abs( dy ) < 8 ) return;
			swiping = Math.abs( dx ) > Math.abs( dy );
			if ( ! swiping ) { dragging = false; track.style.transition = ''; return; }
		}
		e.preventDefault();
		track.style.transform = 'translateX(' + ( -( current * ( cardW + gap ) ) + dx ) + 'px)';
	}, { passive: false } );
	track.addEventListener( 'touchend', function ( e ) {
		if ( ! dragging ) return;
		dragging = false;
		track.style.transition = '';
		if ( ! swiping ) return;
		var dx = e.changedTouches[0].pageX - startX;
		var threshold = Math.min( 60, cardW * 0.2 );
		if ( dx <= -threshold ) goTo( current + 1 );
		else if ( dx >= threshold ) goTo( current - 1 );
		else goTo( current );
	} );

	renderCards();
	initCarousel();

	var resizeTimer;
	window.addEventListener( 'resize', function () {
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( function () {
			current = Math.min( current, maxIdx() );
			initCarousel();
		}, 150 );
	} );
} )();