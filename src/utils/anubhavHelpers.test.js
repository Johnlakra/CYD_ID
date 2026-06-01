import { missingIdCardFields, ID_CARD_REQUIRED_FIELDS } from './anubhavHelpers';

describe('missingIdCardFields', () => {
  const completeRow = {
    name: 'Asha',
    father_name: 'Joseph',
    deanery: 'Hoshiarpur',
    parish: 'Hoshiarpur',
    date_of_birth: '2008-07-21',
    phone: '9711100000',
    postal_address: '12 Church Road',
    level: 'parish',
    designation: 'Member',
    photo_url: 'https://placehold.co/200x200',
  };

  test('returns an empty array when every required field is present', () => {
    expect(missingIdCardFields(completeRow)).toEqual([]);
  });

  test('lists the human labels of blank fields', () => {
    const row = { ...completeRow, father_name: '', photo_url: null, phone: '   ' };
    expect(missingIdCardFields(row)).toEqual(
      expect.arrayContaining(["Father's name", 'Phone', 'Photo'])
    );
    expect(missingIdCardFields(row)).toHaveLength(3);
  });

  test('treats a null/undefined row as entirely incomplete', () => {
    expect(missingIdCardFields(null)).toHaveLength(ID_CARD_REQUIRED_FIELDS.length);
  });
});
