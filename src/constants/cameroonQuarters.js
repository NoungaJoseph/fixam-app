/**
 * Comprehensive Cameroon Quarters & Neighborhoods
 * Covering Douala, Yaoundé, Buea, and Bamenda with zones and search helpers.
 */

export const CAMEROON_CITIES = [
  { id: 'Douala', name: 'Douala', region: 'Littoral' },
  { id: 'Yaoundé', name: 'Yaoundé', region: 'Centre' },
  { id: 'Buea', name: 'Buea', region: 'South West' },
  { id: 'Bamenda', name: 'Bamenda', region: 'North West' },
];

export const CAMEROON_QUARTERS = {
  Douala: [
    // Douala V (North-East / Residential & Commercial)
    { name: 'Kotto', zone: 'Douala V', aliases: ['kotto', 'cotto'] },
    { name: 'Kotto Village', zone: 'Douala V', aliases: ['kotto village'] },
    { name: 'Kotto Bloc Forestier', zone: 'Douala V', aliases: ['bloc forestier'] },
    { name: 'Kotto Bassong', zone: 'Douala V', aliases: ['kotto bassong'] },
    { name: 'Denver', zone: 'Douala V', aliases: ['denver', 'kotto denver'] },
    { name: 'Bonamoussadi', zone: 'Douala V', aliases: ['bonamoussadi', 'bona'] },
    { name: 'Bonamoussadi Sable', zone: 'Douala V', aliases: ['sable bonamoussadi', 'sable'] },
    { name: 'Makepe', zone: 'Douala V', aliases: ['makepe'] },
    { name: 'Makepe Missoke', zone: 'Douala V', aliases: ['makepe missoke', 'missoke'] },
    { name: 'Makepe Rhone Poulenc', zone: 'Douala V', aliases: ['rhone poulenc'] },
    { name: 'Makepe Saint Tropez', zone: 'Douala V', aliases: ['saint tropez'] },
    { name: 'Makepe Maturité', zone: 'Douala V', aliases: ['maturite'] },
    { name: 'Logpom', zone: 'Douala V', aliases: ['logpom'] },
    { name: 'Logpom Bassong', zone: 'Douala V', aliases: ['logpom bassong'] },
    { name: 'Logpom Plateau', zone: 'Douala V', aliases: ['logpom plateau'] },
    { name: 'Beedi', zone: 'Douala V', aliases: ['beedi'] },
    { name: 'PK 8', zone: 'Douala V', aliases: ['pk8', 'pk 8'] },
    { name: 'PK 9', zone: 'Douala V', aliases: ['pk9', 'pk 9'] },
    { name: 'PK 10', zone: 'Douala V', aliases: ['pk10', 'pk 10'] },
    { name: 'PK 11', zone: 'Douala V', aliases: ['pk11', 'pk 11'] },
    { name: 'PK 12', zone: 'Douala V', aliases: ['pk12', 'pk 12'] },
    { name: 'PK 13', zone: 'Douala V', aliases: ['pk13', 'pk 13'] },
    { name: 'PK 14', zone: 'Douala V', aliases: ['pk14', 'pk 14'] },
    { name: 'Lendi', zone: 'Douala V', aliases: ['lendi'] },
    { name: 'Malangue', zone: 'Douala V', aliases: ['malangue'] },
    { name: 'Cité des Palmiers', zone: 'Douala V', aliases: ['cite des palmiers', 'palmiers'] },
    { name: 'Cité SIC', zone: 'Douala V', aliases: ['cite sic'] },
    { name: 'Bepanda', zone: 'Douala V', aliases: ['bepanda'] },
    { name: 'Bepanda Omnisport', zone: 'Douala V', aliases: ['bepanda omnisport'] },
    { name: 'Bepanda Casmando', zone: 'Douala V', aliases: ['casmando'] },
    { name: 'Bepanda Yonyong', zone: 'Douala V', aliases: ['yonyong'] },
    { name: 'Bilongue', zone: 'Douala V', aliases: ['bilongue'] },
    { name: 'Ndogbong', zone: 'Douala V', aliases: ['ndogbong'] },
    { name: 'Ndogpassi', zone: 'Douala V', aliases: ['ndogpassi'] },

    // Douala I (Central / Downtown / Business)
    { name: 'Akwa', zone: 'Douala I', aliases: ['akwa'] },
    { name: 'Akwa Nord', zone: 'Douala I', aliases: ['akwa nord'] },
    { name: 'Bonanjo', zone: 'Douala I', aliases: ['bonanjo'] },
    { name: 'Bonapriso', zone: 'Douala I', aliases: ['bonapriso'] },
    { name: 'Deido', zone: 'Douala I', aliases: ['deido'] },
    { name: 'Deido Rond Point', zone: 'Douala I', aliases: ['rond point deido'] },
    { name: 'Grand Moulin', zone: 'Douala I', aliases: ['grand moulin'] },
    { name: 'Rue Silo', zone: 'Douala I', aliases: ['rue silo'] },
    { name: 'Bali', zone: 'Douala I', aliases: ['bali'] },
    { name: 'Koumassi', zone: 'Douala I', aliases: ['koumassi'] },
    { name: 'Njo-Njo', zone: 'Douala I', aliases: ['njo njo', 'njonjo'] },
    { name: 'Joss', zone: 'Douala I', aliases: ['joss'] },

    // Douala II (Central-South)
    { name: 'New Bell', zone: 'Douala II', aliases: ['new bell'] },
    { name: 'Nkololoun', zone: 'Douala II', aliases: ['nkololoun', 'marche congo'] },
    { name: 'Babylone', zone: 'Douala II', aliases: ['babylone'] },
    { name: 'Ngangue', zone: 'Douala II', aliases: ['ngangue'] },
    { name: 'Kassalafam', zone: 'Douala II', aliases: ['kassalafam'] },
    { name: 'Camp Chinois', zone: 'Douala II', aliases: ['camp chinois'] },
    { name: 'Youpwe', zone: 'Douala II', aliases: ['youpwe'] },
    { name: 'Bois des Singes', zone: 'Douala II', aliases: ['bois des singes'] },

    // Douala III (East / Industrial & Suburban)
    { name: 'Ndokoti', zone: 'Douala III', aliases: ['ndokoti', 'carrefour ndokoti'] },
    { name: 'Bassa', zone: 'Douala III', aliases: ['bassa', 'zone industrielle bassa'] },
    { name: 'Nyalla', zone: 'Douala III', aliases: ['nyalla'] },
    { name: 'Nyalla Rail', zone: 'Douala III', aliases: ['nyalla rail'] },
    { name: 'Nyalla Chateau', zone: 'Douala III', aliases: ['nyalla chateau'] },
    { name: 'Logbaba', zone: 'Douala III', aliases: ['logbaba'] },
    { name: 'PK 0', zone: 'Douala III', aliases: ['pk0', 'pk 0'] },
    { name: 'PK 3', zone: 'Douala III', aliases: ['pk3', 'pk 3'] },
    { name: 'PK 5', zone: 'Douala III', aliases: ['pk5', 'pk 5'] },
    { name: 'Yassa', zone: 'Douala III', aliases: ['yassa'] },
    { name: 'Japoma', zone: 'Douala III', aliases: ['japoma', 'stade japoma'] },
    { name: 'Mbanga Pongo', zone: 'Douala III', aliases: ['mbanga pongo'] },
    { name: 'Bakoko', zone: 'Douala III', aliases: ['bakoko'] },
    { name: 'Village', zone: 'Douala III', aliases: ['village', 'marche village'] },
    { name: 'Boko', zone: 'Douala III', aliases: ['boko'] },
    { name: 'Tergal', zone: 'Douala III', aliases: ['tergal'] },

    // Douala IV (West / Across the Wouri Bridge)
    { name: 'Bonaberi', zone: 'Douala IV', aliases: ['bonaberi'] },
    { name: 'Mabanda', zone: 'Douala IV', aliases: ['mabanda'] },
    { name: 'Sodiko', zone: 'Douala IV', aliases: ['sodiko'] },
    { name: 'Bojongo', zone: 'Douala IV', aliases: ['bojongo'] },
    { name: 'Grand Hangar', zone: 'Douala IV', aliases: ['grand hangar'] },
    { name: 'Ndobo', zone: 'Douala IV', aliases: ['ndobo'] },
    { name: 'Minkwelle', zone: 'Douala IV', aliases: ['minkwelle'] },
    { name: 'Besseke', zone: 'Douala IV', aliases: ['besseke'] },
    { name: 'Bekoko', zone: 'Douala IV', aliases: ['bekoko'] },
    { name: 'Ngwele', zone: 'Douala IV', aliases: ['ngwele'] },
  ],

  Yaoundé: [
    { name: 'Bastos', zone: 'Yaoundé I', aliases: ['bastos'] },
    { name: 'Etoudi', zone: 'Yaoundé I', aliases: ['etoudi'] },
    { name: 'Ngousso', zone: 'Yaoundé V', aliases: ['ngousso'] },
    { name: 'Santa Barbara', zone: 'Yaoundé I', aliases: ['santa barbara'] },
    { name: 'Emana', zone: 'Yaoundé I', aliases: ['emana'] },
    { name: 'Messassi', zone: 'Yaoundé I', aliases: ['messassi'] },
    { name: 'Olembe', zone: 'Yaoundé I', aliases: ['olembe'] },
    { name: 'Tongolo', zone: 'Yaoundé I', aliases: ['tongolo'] },
    { name: 'Nlongkak', zone: 'Yaoundé I', aliases: ['nlongkak'] },
    { name: 'Elig-Edzoa', zone: 'Yaoundé I', aliases: ['elig edzoa'] },
    { name: 'Dragages', zone: 'Yaoundé I', aliases: ['dragages'] },
    { name: 'Golf', zone: 'Yaoundé I', aliases: ['golf'] },
    { name: 'Tsinga', zone: 'Yaoundé II', aliases: ['tsinga'] },
    { name: 'Mokolo', zone: 'Yaoundé II', aliases: ['mokolo'] },
    { name: 'Madagascar', zone: 'Yaoundé II', aliases: ['madagascar'] },
    { name: 'Cité Verte', zone: 'Yaoundé II', aliases: ['cite verte'] },
    { name: 'Nkomkana', zone: 'Yaoundé II', aliases: ['nkomkana'] },
    { name: 'Biyem-Assi', zone: 'Yaoundé VI', aliases: ['biyem assi', 'biyemassi'] },
    { name: 'Biyem-Assi Acacias', zone: 'Yaoundé VI', aliases: ['acacias'] },
    { name: 'Mendong', zone: 'Yaoundé VI', aliases: ['mendong'] },
    { name: 'Simbock', zone: 'Yaoundé VI', aliases: ['simbock'] },
    { name: 'Nkolbisson', zone: 'Yaoundé VII', aliases: ['nkolbisson'] },
    { name: 'Melen', zone: 'Yaoundé III', aliases: ['melen'] },
    { name: 'Ngoa-Ekelle', zone: 'Yaoundé III', aliases: ['ngoa ekelle'] },
    { name: 'Obili', zone: 'Yaoundé III', aliases: ['obili'] },
    { name: 'Nsimeyong', zone: 'Yaoundé III', aliases: ['nsimeyong'] },
    { name: 'Ahala', zone: 'Yaoundé III', aliases: ['ahala'] },
    { name: 'Mvan', zone: 'Yaoundé IV', aliases: ['mvan'] },
    { name: 'Odza', zone: 'Yaoundé IV', aliases: ['odza'] },
    { name: 'Ekounou', zone: 'Yaoundé IV', aliases: ['ekounou'] },
    { name: 'Emombo', zone: 'Yaoundé IV', aliases: ['emombo'] },
    { name: 'Kondengui', zone: 'Yaoundé IV', aliases: ['kondengui'] },
    { name: 'Mimboman', zone: 'Yaoundé IV', aliases: ['mimboman'] },
    { name: 'Omnisports', zone: 'Yaoundé V', aliases: ['omnisports', 'omnisport'] },
    { name: 'Essos', zone: 'Yaoundé V', aliases: ['essos'] },
    { name: 'Nkol-Eton', zone: 'Yaoundé I', aliases: ['nkol eton'] },
    { name: 'Soa', zone: 'Suburbs', aliases: ['soa'] },
  ],

  Buea: [
    { name: 'Molyko', zone: 'Buea Central', aliases: ['molyko'] },
    { name: 'Clerks Quarters', zone: 'Buea Town', aliases: ['clerks quarters', 'clerk'] },
    { name: 'Bokwango', zone: 'Buea South', aliases: ['bokwango'] },
    { name: 'Bonduma', zone: 'Buea Central', aliases: ['bonduma'] },
    { name: 'Federal Quarters', zone: 'Buea Town', aliases: ['federal quarters'] },
    { name: 'Great Soppo', zone: 'Buea Central', aliases: ['great soppo'] },
    { name: 'Small Soppo', zone: 'Buea Central', aliases: ['small soppo'] },
    { name: 'Mile 16', zone: 'Buea Entrance', aliases: ['mile 16', 'bolifamba'] },
    { name: 'Mile 17', zone: 'Buea Entrance', aliases: ['mile 17'] },
    { name: 'Mile 18', zone: 'Buea Entrance', aliases: ['mile 18'] },
    { name: 'Mile 14', zone: 'Buea Suburbs', aliases: ['mile 14', 'dibanda'] },
    { name: 'Mile 15', zone: 'Buea Suburbs', aliases: ['mile 15'] },
    { name: 'Muea', zone: 'Buea East', aliases: ['muea'] },
    { name: 'Buea Town', zone: 'Buea Town', aliases: ['buea town'] },
    { name: 'Sandpit', zone: 'Buea Central', aliases: ['sandpit'] },
    { name: 'Checkpoint', zone: 'Buea Central', aliases: ['checkpoint'] },
    { name: 'Dirty South', zone: 'Molyko', aliases: ['dirty south'] },
    { name: 'University Junction', zone: 'Molyko', aliases: ['ub junction', 'university junction'] },
    { name: 'Wotutu', zone: 'Buea South', aliases: ['wotutu'] },
    { name: 'Bova', zone: 'Buea Mountain', aliases: ['bova'] },
    { name: 'Likoko Membea', zone: 'Buea East', aliases: ['likoko'] },
  ],

  Bamenda: [
    { name: 'Commercial Avenue', zone: 'Bamenda Central', aliases: ['commercial avenue', 'comm avenue'] },
    { name: 'Up Station', zone: 'Bamenda Administrative', aliases: ['up station', 'upstation'] },
    { name: 'Mile 1', zone: 'Bamenda Central', aliases: ['mile 1'] },
    { name: 'Mile 2', zone: 'Bamenda Central', aliases: ['mile 2'] },
    { name: 'Mile 3', zone: 'Bamenda Central', aliases: ['mile 3', 'nkwen'] },
    { name: 'Mile 4 (Nkwen)', zone: 'Nkwen', aliases: ['mile 4', 'nkwen'] },
    { name: 'Cow Street', zone: 'Mankon', aliases: ['cow street'] },
    { name: 'Old Council', zone: 'Mankon', aliases: ['old council'] },
    { name: 'Food Market', zone: 'Bamenda Central', aliases: ['food market'] },
    { name: 'Atuakom', zone: 'Mankon', aliases: ['atuakom'] },
    { name: 'Mankon', zone: 'Mankon', aliases: ['mankon town'] },
    { name: 'Ntarikon', zone: 'Mankon', aliases: ['ntarikon'] },
    { name: 'Mulang', zone: 'Mankon', aliases: ['mulang'] },
    { name: 'Bayelle', zone: 'Nkwen', aliases: ['bayelle'] },
    { name: 'Rendezvous', zone: 'Nkwen', aliases: ['rendezvous'] },
    { name: 'Musang', zone: 'Mankon', aliases: ['musang'] },
    { name: 'Foncha Street', zone: 'Nkwen', aliases: ['foncha street', 'below foncha'] },
    { name: 'Alakuma', zone: 'Mankon', aliases: ['alakuma'] },
    { name: 'Nitob', zone: 'Mankon', aliases: ['nitob'] },
    { name: 'New Road', zone: 'Nkwen', aliases: ['new road'] },
    { name: 'Fish Pond', zone: 'Mankon', aliases: ['fish pond'] },
  ]
};

/**
 * Searches quarters matching a search query in a city (or across all cities).
 * @param {string} query 
 * @param {string} city - e.g. 'Douala' | 'Yaoundé' | 'Buea' | 'Bamenda' | 'all'
 * @returns {Array<{ name: string, city: string, zone: string }>}
 */
export const searchCameroonQuarters = (query, city = 'Douala') => {
  const needle = (query || '').trim().toLowerCase();
  if (!needle) return [];

  const targetCities = city && city !== 'all' && CAMEROON_QUARTERS[city]
    ? [city]
    : Object.keys(CAMEROON_QUARTERS);

  const results = [];
  for (const c of targetCities) {
    const list = CAMEROON_QUARTERS[c] || [];
    for (const q of list) {
      const matchName = q.name.toLowerCase().includes(needle);
      const matchZone = q.zone.toLowerCase().includes(needle);
      const matchAlias = (q.aliases || []).some(a => a.toLowerCase().includes(needle));
      if (matchName || matchZone || matchAlias) {
        results.push({ name: q.name, city: c, zone: q.zone });
      }
    }
  }

  return results.slice(0, 15);
};

/**
 * Returns all quarter names for a city.
 */
export const getAllQuarterNames = (city = 'Douala') => {
  const list = CAMEROON_QUARTERS[city] || [];
  return list.map(q => q.name);
};

/**
 * Checks if a quarter belongs to a city.
 */
export const findQuarter = (quarterName, city = null) => {
  if (!quarterName) return null;
  const qLower = quarterName.trim().toLowerCase();
  const citiesToCheck = city && CAMEROON_QUARTERS[city] ? [city] : Object.keys(CAMEROON_QUARTERS);

  for (const c of citiesToCheck) {
    const match = (CAMEROON_QUARTERS[c] || []).find(q => q.name.toLowerCase() === qLower || (q.aliases || []).some(a => a.toLowerCase() === qLower));
    if (match) return { ...match, city: c };
  }
  return null;
};
