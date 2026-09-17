export const COUNTRY_DATA = {
  Cameroon: {
    name: 'Cameroon',
    code: 'CM',
    dialCode: '+237',
    flag: '🇨🇲',
    currency: 'XAF',
    phoneLength: 9,
    regex: /^6\d{8}$/,
    placeholder: '6XX XXX XXX',
    paymentMethods: [
      { id: 'mtn', name: 'MTN Mobile Money', icon: 'https://seeklogo.com/images/M/mtn-logo-40644FC8B0-seeklogo.com.png', type: 'momo', methodKey: 'MTN_MOMO' },
      { id: 'orange', name: 'Orange Money', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1200px-Orange_logo.svg.png', type: 'momo', methodKey: 'ORANGE_MONEY' },
      { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card-outline', type: 'card', methodKey: 'CARD' }
    ],
    coinPrices: { p1: 5000, p2: 10000, p3: 15000, p4: 20000, p5: 25000 },
    regions: {
      Adamawa: ["Ngaoundéré", "Meiganga", "Tibati", "Banyo"],
      Centre: ["Yaoundé", "Bafia", "Mbalmayo", "Obala"],
      East: ["Bertoua", "Batouri", "Abong-Mbang", "Yokadouma"],
      "Far North": ["Maroua", "Yagoua", "Mokolo", "Kousseri"],
      Littoral: ["Douala", "Edéa", "Nkongsamba", "Loum"],
      North: ["Garoua", "Guider", "Figuil", "Tcholliré"],
      Northwest: ["Bamenda", "Kumbo", "Wum", "Ndop"],
      South: ["Ebolowa", "Sangmélima", "Kribi", "Campo"],
      Southwest: ["Buea", "Limbe", "Kumba", "Tiko"],
      West: ["Bafoussam", "Dschang", "Foumban", "Mbouda"]
    }
  },
  Kenya: {
    name: 'Kenya',
    code: 'KE',
    dialCode: '+254',
    flag: '🇰🇪',
    currency: 'KES',
    phoneLength: 9,
    regex: /^(7|1)\d{8}$/,
    placeholder: '7XX XXX XXX',
    paymentMethods: [
      { id: 'mpesa', name: 'M-Pesa', icon: 'https://seeklogo.com/images/M/m-pesa-logo-3B50CBE977-seeklogo.com.png', type: 'momo', methodKey: 'M_PESA' },
      { id: 'airtel', name: 'Airtel Money', icon: 'https://seeklogo.com/images/A/airtel-logo-55734A1B8A-seeklogo.com.png', type: 'momo', methodKey: 'AIRTEL_MONEY' },
      { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card-outline', type: 'card', methodKey: 'CARD' }
    ],
    coinPrices: { p1: 1000, p2: 2000, p3: 3000, p4: 4000, p5: 5000 },
    regions: {
      Nairobi: ["Nairobi City", "Westlands", "Kasarani", "Langata", "Dagoretti", "Kibra"],
      Mombasa: ["Mombasa Island", "Nyali", "Likoni", "Changamwe", "Kisauni"],
      Kisumu: ["Kisumu City", "Muhoroni", "Nyando", "Kadianga"],
      Nakuru: ["Nakuru City", "Naivasha", "Molo", "Gilgil"],
      Kiambu: ["Thika", "Kiambu Town", "Ruiru", "Kikuyu"]
    }
  },
  Ghana: {
    name: 'Ghana',
    code: 'GH',
    dialCode: '+233',
    flag: '🇬🇭',
    currency: 'GHS',
    phoneLength: 9,
    regex: /^(2|5)\d{8}$/,
    placeholder: '2XX XXX XXX',
    paymentMethods: [
      { id: 'mtn', name: 'MTN MoMo', icon: 'https://seeklogo.com/images/M/mtn-logo-40644FC8B0-seeklogo.com.png', type: 'momo', methodKey: 'MTN_MOMO' },
      { id: 'vodafone', name: 'Vodafone Cash', icon: 'https://seeklogo.com/images/V/vodafone-logo-B3A9B3E3C4-seeklogo.com.png', type: 'momo', methodKey: 'VODAFONE_CASH' },
      { id: 'airteltigo', name: 'AirtelTigo Money', icon: 'https://seeklogo.com/images/A/airtel-logo-55734A1B8A-seeklogo.com.png', type: 'momo', methodKey: 'AIRTEL_MONEY' },
      { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card-outline', type: 'card', methodKey: 'CARD' }
    ],
    coinPrices: { p1: 120, p2: 240, p3: 360, p4: 480, p5: 600 },
    regions: {
      "Greater Accra": ["Accra", "Tema", "Madina", "Ashaiman", "Adenta"],
      Ashanti: ["Kumasi", "Obuasi", "Konongo", "Mampong"],
      Western: ["Sekondi-Takoradi", "Tarkwa", "Axim", "Elubo"],
      Northern: ["Tamale", "Yendi", "Savelugu"],
      Central: ["Cape Coast", "Winneba", "Elmina", "Kasoa"]
    }
  },
  "Ivory Coast": {
    name: 'Ivory Coast',
    code: 'CI',
    dialCode: '+225',
    flag: '🇨🇮',
    currency: 'XOF',
    phoneLength: 10,
    regex: /^(01|05|07)\d{8}$/,
    placeholder: '07XX XX XX XX',
    paymentMethods: [
      { id: 'mtn', name: 'MTN Mobile Money', icon: 'https://seeklogo.com/images/M/mtn-logo-40644FC8B0-seeklogo.com.png', type: 'momo', methodKey: 'MTN_MOMO' },
      { id: 'orange', name: 'Orange Money', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1200px-Orange_logo.svg.png', type: 'momo', methodKey: 'ORANGE_MONEY' },
      { id: 'moov', name: 'Moov Money', icon: 'https://seeklogo.com/images/M/moov-logo-0F3F73D852-seeklogo.com.png', type: 'momo', methodKey: 'MOOV_MONEY' },
      { id: 'wave', name: 'Wave', icon: 'https://seeklogo.com/images/W/wave-logo-FC07FEEBD5-seeklogo.com.png', type: 'momo', methodKey: 'WAVE' },
      { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card-outline', type: 'card', methodKey: 'CARD' }
    ],
    coinPrices: { p1: 5000, p2: 10000, p3: 15000, p4: 20000, p5: 25000 },
    regions: {
      Abidjan: ["Cocody", "Plateau", "Yopougon", "Treichville", "Abobo", "Marcory"],
      Yamoussoukro: ["Yamoussoukro City", "Attiégouakro"],
      "Bas-Sassandra": ["San-Pédro", "Sassandra"],
      "Vallée du Bandama": ["Bouaké", "Katiola"],
      "Haut-Sassandra": ["Daloa", "Issia"]
    }
  },
  Tanzania: {
    name: 'Tanzania',
    code: 'TZ',
    dialCode: '+255',
    flag: '🇹🇿',
    currency: 'TZS',
    phoneLength: 9,
    regex: /^(6|7)\d{8}$/,
    placeholder: '7XX XXX XXX',
    paymentMethods: [
      { id: 'mpesa', name: 'M-Pesa', icon: 'https://seeklogo.com/images/M/m-pesa-logo-3B50CBE977-seeklogo.com.png', type: 'momo', methodKey: 'M_PESA' },
      { id: 'tigo', name: 'Tigo Pesa', icon: 'https://seeklogo.com/images/T/tigo-logo-C78C9E73D3-seeklogo.com.png', type: 'momo', methodKey: 'TIGO_PESA' },
      { id: 'airtel', name: 'Airtel Money', icon: 'https://seeklogo.com/images/A/airtel-logo-55734A1B8A-seeklogo.com.png', type: 'momo', methodKey: 'AIRTEL_MONEY' },
      { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card-outline', type: 'card', methodKey: 'CARD' }
    ],
    coinPrices: { p1: 20000, p2: 40000, p3: 60000, p4: 80000, p5: 100000 },
    regions: {
      "Dar es Salaam": ["Ilala", "Kinondoni", "Temeke", "Kigamboni", "Ubungo"],
      Arusha: ["Arusha City", "Meru", "Karatu", "Monduli"],
      Mwanza: ["Nyamagana", "Ilemela", "Sengerema", "Geita"],
      Dodoma: ["Dodoma City", "Kondoa", "Mpwapwa"],
      Zanzibar: ["Zanzibar Town", "Mkokotoni", "Chake-Chake"]
    }
  },
  Egypt: {
    name: 'Egypt',
    code: 'EG',
    dialCode: '+20',
    flag: '🇪🇬',
    currency: 'EGP',
    phoneLength: 10,
    regex: /^1\d{9}$/,
    placeholder: '1X XXXX XXXX',
    paymentMethods: [
      { id: 'vodafone', name: 'Vodafone Cash', icon: 'https://seeklogo.com/images/V/vodafone-logo-B3A9B3E3C4-seeklogo.com.png', type: 'momo', methodKey: 'VODAFONE_CASH' },
      { id: 'etisalat', name: 'Etisalat Cash', icon: 'https://seeklogo.com/images/E/etisalat-logo-08EC94FAEB-seeklogo.com.png', type: 'momo', methodKey: 'ETISALAT_CASH' },
      { id: 'orange', name: 'Orange Money', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1200px-Orange_logo.svg.png', type: 'momo', methodKey: 'ORANGE_MONEY' },
      { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card-outline', type: 'card', methodKey: 'CARD' }
    ],
    coinPrices: { p1: 380, p2: 760, p3: 1140, p4: 1520, p5: 1900 },
    regions: {
      Cairo: ["Cairo City", "Heliopolis", "Maadi", "Nasr City", "Zamalek"],
      Giza: ["Giza City", "6th of October", "Haram", "Mohandessin"],
      Alexandria: ["Alexandria City", "Burj Al Arab", "Montaza", "Smouha"],
      Qalyubia: ["Banha", "Shubra El Kheima"],
      Gharbia: ["Tanta", "Mahalla El Kubra"]
    }
  },
  // NIGERIA IS KEPT ON STANDBY
  Nigeria: {
    name: 'Nigeria',
    code: 'NG',
    dialCode: '+234',
    flag: '🇳🇬',
    currency: 'NGN',
    phoneLength: 10,
    regex: /^[789]\d{9}$/,
    placeholder: '80X XXX XXXX',
    paymentMethods: [
      { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card-outline', type: 'card', methodKey: 'CARD' },
      { id: 'bank_transfer', name: 'Bank Transfer', icon: 'bank-transfer', type: 'bank_transfer', methodKey: 'BANK_TRANSFER' }
    ],
    coinPrices: { p1: 12000, p2: 24000, p3: 36000, p4: 48000, p5: 60000 },
    regions: {
      Lagos: ["Ikeja", "Lekki", "Surulere", "Yaba", "Victoria Island"],
      Abuja: ["Garki", "Wuse", "Maitama", "Asokoro"],
      Rivers: ["Port Harcourt", "Obio-Akpor", "Bonny"],
      Kano: ["Kano City", "Fagge", "Gwale"],
      Oyo: ["Ibadan", "Ogbomosho", "Oyo Town"]
    }
  }
};

// Filtered list to hold Nigeria on standby (inactive in selections)
export const SUPPORTED_COUNTRIES = [
  COUNTRY_DATA.Cameroon,
  COUNTRY_DATA.Kenya,
  COUNTRY_DATA.Ghana,
  COUNTRY_DATA['Ivory Coast'],
  COUNTRY_DATA.Tanzania,
  COUNTRY_DATA.Egypt
];

// Fallback helper to automatically detect the country based on the phone prefix
export const detectCountryFromPhone = (phone) => {
  if (!phone) return 'Cameroon';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('237')) return 'Cameroon';
  if (cleaned.startsWith('254')) return 'Kenya';
  if (cleaned.startsWith('233')) return 'Ghana';
  if (cleaned.startsWith('225')) return 'Ivory Coast';
  if (cleaned.startsWith('255')) return 'Tanzania';
  if (cleaned.startsWith('20')) return 'Egypt';
  // Nigeria is on standby:
  // if (cleaned.startsWith('234')) return 'Nigeria';
  return 'Cameroon';
};

export const getCurrencyForUser = (userOrCountry) => {
  if (!userOrCountry) return 'XAF';
  const countryName = typeof userOrCountry === 'string' ? userOrCountry : (userOrCountry.country || 'Cameroon');
  return COUNTRY_DATA[countryName]?.currency || 'XAF';
};
