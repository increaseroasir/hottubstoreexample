/* Pure Soak quiz funnel — shared config */
window.PS_QUIZ = {
	STORAGE_KEY: 'pureSoakQuiz',
	SUBMIT_URL: '',
	INVENTORY_URL: 'inventory/',
	DEFAULT_SHOWROOM: 'scottsdale',
	ZIP_SHOWROOM_MAP: [
		{ prefixes: ['850', '851', '852', '853'], showroom: 'phoenix' },
		{ prefixes: ['8525', '8526'], showroom: 'scottsdale' }
	],
	SHOWROOMS: {
		scottsdale: {
			id: 'scottsdale',
			name: 'Scottsdale, AZ',
			phone: '8447731004',
			times: ['11:00 AM', '3:00 PM', '6:00 PM']
		},
		phoenix: {
			id: 'phoenix',
			name: 'Phoenix, AZ',
			phone: '8447731004',
			times: ['11:00 AM', '3:00 PM', '6:00 PM']
		}
	},
	getShowroomForZip: function (zip) {
		var z = String(zip || '').replace(/\D/g, '').slice(0, 5);
		if (!z) return this.SHOWROOMS[this.DEFAULT_SHOWROOM];
		var map = this.ZIP_SHOWROOM_MAP;
		var match = null;
		var bestLen = 0;
		for (var i = 0; i < map.length; i++) {
			var entry = map[i];
			for (var j = 0; j < entry.prefixes.length; j++) {
				var p = entry.prefixes[j];
				if (z.indexOf(p) === 0 && p.length > bestLen) {
					bestLen = p.length;
					match = entry.showroom;
				}
			}
		}
		return this.SHOWROOMS[match || this.DEFAULT_SHOWROOM];
	},
	load: function () {
		try {
			var raw = sessionStorage.getItem(this.STORAGE_KEY);
			return raw ? JSON.parse(raw) : {};
		} catch (e) {
			return {};
		}
	},
	save: function (data) {
		sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
	},
	merge: function (patch) {
		var data = this.load();
		Object.keys(patch).forEach(function (k) { data[k] = patch[k]; });
		this.save(data);
		return data;
	},
	prefillFromQuery: function () {
		if (typeof URLSearchParams === 'undefined') return;
		var params = new URLSearchParams(window.location.search);
		if (!params.toString()) return;

		var data = this.load();
		var patch = {};
		var contact = Object.assign({}, data.contact || {});

		function pick(keys) {
			for (var i = 0; i < keys.length; i++) {
				var v = params.get(keys[i]);
				if (v) return decodeURIComponent(String(v).replace(/\+/g, ' ')).trim();
			}
			return '';
		}

		var zip = pick(['zip', 'postal_code', 'postal-code', 'postalCode']);
		if (zip) patch.zip = zip.replace(/\D/g, '').slice(0, 5);

		var name = pick(['name', 'full_name', 'fullName']);
		if (!name) {
			var first = pick(['first_name', 'firstname', 'fname', 'fn']);
			var last = pick(['last_name', 'lastname', 'lname', 'ln']);
			name = [first, last].filter(Boolean).join(' ');
		}
		if (name) contact.name = name;

		var email = pick(['email', 'email_address', 'emailAddress']);
		if (email) contact.email = email;

		var phone = pick(['phone', 'tel', 'mobile', 'phone_number', 'phoneNumber']);
		if (phone) contact.phone = phone;

		if (Object.keys(contact).length) patch.contact = contact;
		if (Object.keys(patch).length) this.merge(patch);
	}
};

window.PS_QUIZ.prefillFromQuery();