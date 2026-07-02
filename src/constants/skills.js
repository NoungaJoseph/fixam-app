import { translateService } from '../i18n/translate';

export const ALL_SKILLS = [
  // Construction & Repair
  'Plumbing', 'Electrician', 'Carpenter', 'Mason', 'Painter', 'Roofer', 'Welder', 'Locksmith', 'Glazier', 'Scaffolder',
  'Drywall Installer', 'Flooring Specialist', 'Tile Setter', 'Bricklayer', 'Ironworker', 'Pipefitter', 'Hvac Technician',
  'Solar Panel Installer', 'Insulation Contractor', 'Window Installer', 'Deck Builder', 'Fence Installer',
  
  // Maintenance & Cleaning
  'House Cleaning', 'Office Cleaning', 'Window Cleaning', 'Carpet Cleaning', 'Pool Maintenance', 'Gardening',
  'Landscaping', 'Pest Control', 'Waste Removal', 'Pressure Washing', 'Gutter Cleaning', 'Chimney Sweep',
  'Appliance Repair', 'Generator Repair', 'AC Repair', 'Fridge Repair', 'Washing Machine Repair', 'TV Repair',
  
  // Technology & IT
  'Computer Repair', 'Software Installation', 'Network Setup', 'CCTV Installation', 'Smart Home Setup',
  'Mobile Phone Repair', 'Web Development', 'Graphic Design', 'Data Entry', 'Digital Marketing', 'IT Support',
  
  // Beauty & Personal Care
  'Hair Styling', 'Barber', 'Makeup Artist', 'Nail Technician', 'Massage Therapist', 'Esthetician', 'Personal Trainer',
  'Yoga Instructor', 'Tattoo Artist', 'Tailor', 'Fashion Designer', 'Shoe Repair',
  
  // Events & Hospitality
  'Event Planning', 'Catering', 'Chef', 'Bartender', 'DJ', 'Photographer', 'Videographer', 'Decorator',
  'Florist', 'Waiter', 'Security Guard', 'Bouncer', 'Valet Parking',
  
  // Transport & Delivery
  'Moving Service', 'Delivery Driver', 'Courier', 'Truck Driver', 'Taxi Driver', 'Mechanic', 'Auto Electrician',
  'Car Wash', 'Towing Service', 'Bicycle Repair', 'Tricycle',
  
  // Education & Professional
  'Tutor', 'Language Teacher', 'Music Teacher', 'Accounting', 'Legal Advice', 'Translation', 'Writing',
  'Virtual Assistant', 'Baby Sitting', 'Nanny', 'Elderly Care', 'Pet Sitting', 'Dog Walker'
];

export const LOCAL_SKILLS = [
  'Plumbing', 'Electrical wiring', 'Carpentry', 'Painting', 'Tiling', 'Masonry', 'Welding', 'Roofing', 'Ceiling installation', 'POP design',
  'AC repair', 'Fridge repair', 'Washing machine repair', 'Generator repair', 'Solar installation', 'Inverter installation', 'CCTV installation', 'Satellite dish installation', 'Smart lock installation', 'Door repair',
  'Window repair', 'Aluminium fabrication', 'Glass installation', 'Furniture assembly', 'Cabinet making', 'Upholstery', 'Pest control', 'Fumigation', 'House cleaning', 'Office cleaning',
  'Laundry', 'Dry cleaning', 'Gardening', 'Landscaping', 'Tree trimming', 'Pool cleaning', 'Water tank cleaning', 'Borehole repair', 'Pump repair', 'Drainage cleaning',
  'Septic tank service', 'Car wash', 'Auto mechanic', 'Auto electrician', 'Panel beating', 'Car painting', 'Tyre service', 'Battery service', 'Motorcycle repair', 'Tricycle repair',
  'Phone repair', 'Laptop repair', 'Printer repair', 'Network setup', 'Software installation', 'Data recovery', 'Graphic design', 'Web design', 'Social media management', 'Photography',
  'Videography', 'Video editing', 'Event decoration', 'Catering', 'Cake baking', 'Hair styling', 'Barbing', 'Makeup artistry', 'Tailoring', 'Fashion design',
  'Shoe repair', 'Bag repair', 'Security guard', 'Private driver', 'Delivery service', 'Moving service', 'Errand service', 'Home nursing', 'Child care', 'Elder care', 'Tricycle',
  'Fitness training', 'Music lessons', 'Math tutoring', 'English tutoring', 'French tutoring', 'Computer tutoring', 'CV writing', 'Translation', 'Legal documentation', 'Accounting',
  'Bookkeeping', 'Tax filing', 'Real estate agent', 'Property inspection', 'Interior decoration', 'Appliance installation', 'Cooker repair', 'Microwave repair', 'TV repair', 'Sound system repair',
  'Gate automation', 'Fence installation', 'Floor polishing', 'Wallpaper installation', 'Curtain installation', 'Blinds installation', 'Locksmith', 'Key cutting', 'Signage', 'Printing'
];

// Grouping skills for categorization if needed
export const SKILL_CATEGORIES = {
  'Home & Construction': ['Plumbing', 'Electrician', 'Carpenter', 'Mason', 'Painter', 'Roofer', 'Welder', 'Locksmith'],
  'Cleaning & Maintenance': ['House Cleaning', 'Office Cleaning', 'Gardening', 'Pest Control', 'Appliance Repair'],
  'Beauty & Fashion': ['Hair Styling', 'Barber', 'Makeup Artist', 'Tailor', 'Fashion Designer'],
  'Technology': ['Computer Repair', 'IT Support', 'Web Development', 'CCTV Installation'],
  'Events': ['Event Planning', 'Catering', 'DJ', 'Photographer'],
  'Transport': ['Moving Service', 'Delivery Driver', 'Mechanic']
};

export const normalizeSkill = (input) => {
  if (!input) return '';
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  
  const allPredefined = Array.from(new Set([...ALL_SKILLS, ...LOCAL_SKILLS]));
  
  for (const skill of allPredefined) {
    if (skill.toLowerCase() === lower) {
      return skill;
    }
    const french = translateService(skill, { lng: 'fr' });
    if (french && french.toLowerCase() === lower) {
      return skill;
    }
    const english = translateService(skill, { lng: 'en' });
    if (english && english.toLowerCase() === lower) {
      return skill;
    }
  }
  
  return trimmed;
};
