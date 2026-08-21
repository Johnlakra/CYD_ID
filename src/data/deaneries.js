// src/data/deaneries.js
//
// Single source of truth for the deanery -> parish dropdowns.
// FormDetails and ManageProfiles both import from here so they can never
// drift from each other again.
//
// Reflects the 2026 reorganisation:
//   - ABOHAR deanery erected, taking 8 parishes from Muktsar + Ghallu (Station)
//   - Faridkot, Guru Har Sahai and Tehna moved Firozepur -> Muktsar
//   - "Ferozpur" respelled "Firozepur" (deanery and its parishes)
//   - Dhina and Chittewani added as separate parishes. The older combined
//     "Dhina-Chittewani" label is NOT offered in the form (see LEGACY_PARISHES
//     below) but is still recognised, so the profiles already on it are left
//     alone rather than treated as bad data.
//
// Labels are the short display forms: they have to fit the fixed-width parish
// slot on the ID card (see IDCard.jsx), which does not wrap. Keep new entries
// under ~30 characters.

export const deaneries = {
  Abohar: [
    'Abohar',
    'Danewala',
    'Fazilka',
    'Ghallu (Station)',
    'Gidderbaha (Station)',
    'Jalalabad',
    'Malout',
    'Malout Pind',
    'Sikhwala',
  ],
  Ajnala: [
    'Ajnala',
    'Chamiyari',
    'Chogawan',
    'Chuchakwal',
    'Karyal',
    'Othian',
    'Punga',
    'Ramdas',
  ],
  Amritsar: [
    'Amritsar Cantt.',
    'Bharariwal',
    'Gumtala',
    'Khasa',
    'Lahorigate',
    'Majitha Road',
    'Nai Abadi',
    'Rajasansi',
  ],
  Dhariwal: [
    'Batala',
    'Dhariwal',
    'Dialgarh',
    'Kalanaur',
    'Mastkot',
    'Naushera Majja Singh',
    'Qadian',
  ],
  'Fatehgarh Churian': [
    'Dera Baba Nanak',
    'Dharamkot Randhawa',
    'Fatehgarh Churian',
    'Ghanie Ke Banger',
    'Kotli',
    'Machi Nangal',
    'Majitha',
    'Pakharpura',
  ],
  Firozepur: [
    'Badhni Mahafariste Wala',
    'Firozepur Canal Colony',
    'Firozepur Cantt.',
    'Firozepur City',
    'Gulami Wala',
    'Lohgarh-Sur Singh Wala (Station)',
    'Mamdot',
    'Mudki (Station)',
    'Sadiq',
    'Talwandi Bhai',
  ],
  Gurdaspur: [
    'Balun (Station)',
    'Dalhousie',
    'Dina Nagar',
    'Dorangala',
    'Gurdaspur',
    'Jandwal, Pathankot',
    'Kahnuwan',
    'Narot Jaimal Singh (Station)',
    'Pathankot City',
    'Puranashalla',
    'Sarawan',
    'Sidhwan Jamita, Joura Chitra',
    'Sujanpur, Pathankot',
  ],
  Hoshiarpur: [
    'Baijnath',
    'Balachaur',
    'Bassi Bahian',
    'Bhunga',
    'Gaggal',
    'Garshankar',
    'Jindwari',
    'Kakkon',
    'Mehtiana, Khanaura',
    'Nandachaur',
    'Nangal',
    'Palampur',
    'Una',
    'Yol Camp',
  ],
  'Jalandhar Cantt.': [
    'Apra',
    'Banga',
    'Behram (Station)',
    'Chittewani',
    'Dhina',
    'Jalandhar Cantt',
    'Jandiala Manjki',
    'Nawanshahar',
    'Phagwara',
    'Phulriwal',
    'Rawalpindi',
    'Sansarpur',
  ],
  'Jalandhar City': [
    'Adampur',
    'Bootan',
    'Chogitty',
    'Gakhalan',
    'Jalandhar City',
    'Lambapind',
    'Maqsudan',
    'Nandanpur',
  ],
  Kapurthala: [
    'Hussainpur-Lodhi Bhulana',
    'Kapurthala',
    'Kartarpur',
    'Kishangarh',
    'Mehatpur',
    'Nakodar',
    'Shahkot',
    'Sultanpur Lodhi',
  ],
  Ludhiana: [
    'BRS Nagar',
    'Jagraon',
    'Jalandhar Bypass, Ludhiana',
    'Kidwai Nagar',
    'Phillaur',
    'Raekot',
    'Sarabha Nagar',
  ],
  Moga: [
    'Baghapurana',
    'Buggipura, Moga (Station)',
    'Buttar, Moga (Station)',
    'Dharamkot, Moga',
    'Kot-Ise-Khan, Moga (Station)',
    'Makhu',
    'Moga',
    'Nihal Singh Wala, Moga (Station)',
    'Singhanwala, Moga',
    'Takhtupura',
    'Zira',
  ],
  Muktsar: [
    'Bhagsar',
    'Bir Sarkar, Muktsar',
    'Faridkot',
    'Guru Har Sahai',
    'Jaiton',
    'Kotkapura',
    'Muktsar',
    'Panjgaraian (Station)',
    'Saraenaga (Station)',
    'Tehna, Faridkot',
  ],
  Sahnewal: [
    'Bhammian Kalan (Station)',
    'Jamalpur',
    'Khanna',
    'Khanpur-Jassar-Sangowal-Rania',
    'Machhiwara',
    'Machian Khurd',
    'Sahnewal',
    'Samrala',
  ],
  Tanda: [
    'Bhogpur',
    'Bholath',
    'Dasuya',
    'Mukerian',
    'Sri Hargobindpur',
    'Tanda',
  ],
  'Tarn Taran': [
    'Akalgarh (Station)',
    'Beas',
    'Bhikhiwind',
    'Bhojian',
    'Chabhal',
    'Fatehabad',
    'Harike',
    'Jandiala Guru',
    'Khem Karan',
    'Patti',
    'Tarn Taran',
  ],
};

export const deaneryOptions = Object.keys(deaneries);

export const parishesFor = (deanery) => deaneries[deanery] ?? [];

/**
 * Parish labels that are retained but deliberately NOT offered in the form.
 *
 * Profiles already saved under these keep them: the label is recognised, so
 * migrations and audits treat those rows as intentional rather than broken,
 * and the edit form still shows the stored value (see parishesForWith). New
 * profiles cannot select them, so the label shrinks over time instead of
 * growing.
 *
 * "Dhina-Chittewani" was one parish covering two villages; the directory now
 * lists Dhina (St. Sebastian's, 1996) and Chittewani (St. Mary's, 1982)
 * separately. Which of the two each existing profile belongs to has not been
 * confirmed, so those rows stay on the combined label until it is.
 */
export const LEGACY_PARISHES = {
  'Jalandhar Cantt.': ['Dhina-Chittewani'],
};

/** True if a stored pair is either current or a knowingly-retained legacy label. */
export const isKnownParish = (deanery, parish) =>
  (deaneries[deanery] ?? []).includes(parish) ||
  (LEGACY_PARISHES[deanery] ?? []).includes(parish);

// Profiles saved before the 2026 reorganisation may hold labels that no longer
// exist above ("Ferozpur", "Dhina-Chittewani", ...). A MUI <Select> renders
// blank when its value is not among its options, which silently hides the
// stored value from whoever is editing the record. These helpers append the
// stored value so it always renders and stays selectable until someone picks a
// current one. Safe to keep after the migration: they are a no-op for values
// that are already valid.

export const deaneryOptionsWith = (current) =>
  current && !deaneries[current] ? [...deaneryOptions, current] : deaneryOptions;

export const parishesForWith = (deanery, current) => {
  const list = parishesFor(deanery);
  return current && !list.includes(current) ? [...list, current] : list;
};

export const levelOptions = ['parish', 'deanery', 'dexco'];

export const designationOptions = [
  'Member',
  'President',
  'Vice-President',
  'Secretary',
  'Joint Secretary',
  'Treasurer',
  'Joint Treasurer',
  'Media Secretary',
  'Joint Media Secretary',
  'Boy Representative',
  'Girl Representative',
  'Boy Spokesperson',
  'Girl Spokesperson',
];
