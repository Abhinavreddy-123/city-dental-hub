export const SITE = {
  name: "City Dental Clinic",
  legalName: "City Multispeciality Dental Hospital",
  tagline: "Healthy Smiles, Happy Lives",
  established: 2010,
  address:
    "Shop No #1, KR & MS Reddy Complex, Near Vijay Talkies Road, Hanamkonda Chowrastha, Hanamkonda, Warangal-506001, Telangana, India",
  city: "Hanamkonda, Warangal",
  callNow: "+919849187844",
  callNowDisplay: "+91 98491 87844",
  phones: [
    { label: "Emergency / Call Now", value: "+919849187844", display: "+91 98491 87844" },
    { label: "Reception", value: "+919866139235", display: "+91 98661 39235" },
    { label: "Appointments", value: "+919849567318", display: "+91 98495 67318" },
  ],
  hours: [
    { day: "Monday – Saturday", value: "9:00 AM – 8:00 PM" },
    { day: "Sunday", value: "Closed" },
  ],
  whatsapp: "919849187844",
  mapEmbed:
    "https://www.google.com/maps?q=Hanamkonda+Chowrastha,+Hanamkonda,+Warangal&output=embed",
  socials: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    google: "https://www.google.com/maps?q=Hanamkonda+Chowrastha,+Hanamkonda,+Warangal",
  },
} as const;

export const DOCTORS = [
  {
    slug: "manoranjan-reddy",
    name: "Dr. P. Manoranjan Reddy",
    qualifications: "MDS (Endodontics), BDS · Certified Cosmetic Dental Surgeon",
    focus: "Root Canals · Cosmetic Dentistry · Crowns & Veneers",
    bio:
      "With 15+ years of clinical experience, Dr. Manoranjan is known for his gentle chair-side manner and precise, single-visit root canal technique.",
    specializations: [
      "Single Visit Root Canal Treatment",
      "Cosmetic Dentistry & Smile Makeovers",
      "Dental Crowns & Bridges",
      "Post & Core Treatment",
      "Re-Root Canal Treatment",
      "Dental Veneers & Laminates",
    ],
    memberships: ["Indian Dental Association", "Indian Endodontic Society"],
  },
  {
    slug: "srujana-kota",
    name: "Dr. Srujana Kota",
    qualifications: "BDS, FAGE (Manipal) · Certified in Pediatric Dentistry",
    focus: "General & Pediatric Dentistry · Preventive Care",
    bio:
      "Warm, patient and wonderful with children — Dr. Srujana specialises in preventive and family dentistry, and is a favourite with anxious patients.",
    specializations: [
      "General Dentistry & Checkups",
      "Pediatric Dentistry",
      "Preventive Dental Care",
      "Dental Fillings & Restorations",
      "Teeth Cleaning & Scaling",
      "Fluoride & Sealants",
    ],
    memberships: ["Indian Dental Association", "Indian Society of Pedodontics"],
  },
] as const;

export const SERVICES = [
  {
    slug: "general-dentistry",
    title: "General Dentistry",
    icon: "Stethoscope",
    summary: "Comprehensive check-ups, cleaning, fillings, extractions and gum care.",
    features: [
      "Dental examinations",
      "Professional teeth cleaning",
      "Composite & amalgam fillings",
      "Tooth extractions",
      "Gum disease treatment",
      "Digital dental X-rays",
    ],
  },
  {
    slug: "cosmetic-dentistry",
    title: "Cosmetic Dentistry",
    icon: "Sparkles",
    summary: "Beautiful, natural-looking smiles with veneers, bonding and reshaping.",
    features: [
      "Porcelain veneers",
      "Dental bonding",
      "Smile makeovers",
      "Tooth reshaping",
      "Gum contouring",
      "Composite restorations",
    ],
  },
  {
    slug: "root-canal",
    title: "Root Canal Treatment",
    icon: "Activity",
    summary: "Painless, single-visit RCT by our endodontics specialist.",
    features: [
      "Single-visit root canal",
      "Multi-rooted tooth treatment",
      "Re-root canal treatment",
      "Post & core restoration",
      "Apicoectomy",
      "Advanced pain management",
    ],
  },
  {
    slug: "dental-implants",
    title: "Dental Implants",
    icon: "Bone",
    summary: "Replace missing teeth with permanent, natural-feeling implants.",
    features: [
      "Single tooth implants",
      "Multiple tooth implants",
      "Full mouth rehabilitation",
      "Implant-supported dentures",
      "Bone grafting",
      "Sinus lift procedures",
    ],
  },
  {
    slug: "orthodontics",
    title: "Orthodontics",
    icon: "Smile",
    summary: "Straighten your teeth with braces, ceramic or clear aligners.",
    features: [
      "Traditional metal braces",
      "Ceramic braces",
      "Clear aligners",
      "Retainers",
      "Space maintainers",
      "Bite correction",
    ],
  },
  {
    slug: "pediatric",
    title: "Pediatric Dentistry",
    icon: "Baby",
    summary: "Gentle, playful dental care for children of every age.",
    features: [
      "First dental visit guidance",
      "Preventive care for children",
      "Fluoride treatments",
      "Dental sealants",
      "Space maintainers",
      "Habit counselling",
    ],
  },
  {
    slug: "teeth-whitening",
    title: "Teeth Whitening",
    icon: "Sun",
    summary: "Brighter, whiter smiles in a single visit.",
    features: [
      "In-office power whitening",
      "Take-home whitening kits",
      "Laser teeth whitening",
      "Stain removal",
      "Shade matching",
      "Sensitivity management",
    ],
  },
  {
    slug: "preventive",
    title: "Preventive Care",
    icon: "Shield",
    summary: "Regular check-ups and guidance to keep problems away.",
    features: [
      "Regular check-ups",
      "Professional cleaning",
      "Oral hygiene education",
      "Diet counselling",
      "Custom mouthguards",
      "Night guards for bruxism",
    ],
  },
] as const;

export const PRICING_PLANS = [
  {
    name: "Basic Checkup",
    price: 299,
    tagline: "Perfect for a first visit",
    features: [
      "Complete oral examination",
      "Dental cleaning & polishing",
      "Basic cavity detection",
      "Oral hygiene instructions",
      "Dental consultation",
    ],
  },
  {
    name: "Comprehensive Care",
    price: 1299,
    tagline: "Most Popular",
    popular: true,
    features: [
      "Everything in Basic",
      "Full mouth X-ray",
      "Deep cleaning & scaling",
      "Fluoride treatment",
      "Cavity filling (2 teeth)",
      "Specialist consultation",
      "Personalised treatment plan",
    ],
  },
  {
    name: "Family Package",
    price: 3999,
    tagline: "For families of 4",
    features: [
      "Everything in Comprehensive",
      "Pediatric dental care",
      "Orthodontic consultation",
      "Emergency dental care",
      "Priority appointments",
      "Annual dental plan",
      "Discount on additional treatments",
    ],
  },
  {
    name: "Premium Dental",
    price: 7999,
    tagline: "The full experience",
    features: [
      "Everything in Family Package",
      "Unlimited family members",
      "Cosmetic dentistry",
      "Teeth whitening",
      "Implants consultation",
      "Smile makeover planning",
      "VIP appointments & home visits",
    ],
  },
] as const;

export const ADDITIONAL_SERVICES = [
  { name: "Teeth Whitening", price: "₹2,999" },
  { name: "Dental Implants", price: "₹25,000", note: "per tooth with crown" },
  { name: "Orthodontic Treatment", price: "₹35,000", note: "complete braces" },
  { name: "Root Canal Treatment", price: "₹4,500", note: "per tooth" },
  { name: "Wisdom Tooth Extraction", price: "₹3,500", note: "per tooth" },
  { name: "Dental Crown", price: "₹5,000", note: "porcelain, per tooth" },
];

export const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
];

export const FAQS = [
  {
    q: "What are your working hours?",
    a: "We are open Monday to Saturday, 9:00 AM to 8:00 PM. The clinic is closed on Sundays. Emergency care is available 24/7 — call +91 98491 87844.",
  },
  {
    q: "Do I need an appointment or can I walk in?",
    a: "We recommend booking an appointment so we can dedicate the right time to you, but walk-ins are welcome during working hours.",
  },
  {
    q: "Is root canal treatment painful?",
    a: "Modern single-visit root canals are virtually painless. We use effective local anaesthesia and gentle techniques so most patients feel nothing more than mild pressure.",
  },
  {
    q: "Do you accept insurance?",
    a: "Yes — we accept most major health insurance providers, corporate dental plans and government schemes, and offer cashless facility with direct billing support.",
  },
  {
    q: "How much does teeth whitening cost?",
    a: "In-clinic professional teeth whitening starts at ₹2,999. Your dentist will confirm the exact plan after a short consultation.",
  },
  {
    q: "Is the clinic child-friendly?",
    a: "Absolutely. Dr. Srujana specialises in pediatric dentistry and our team is trained to keep children calm, safe and smiling.",
  },
  {
    q: "Do you offer EMI or payment plans?",
    a: "Yes, we accept cash, cards, UPI, net banking and offer EMI options for larger treatments.",
  },
];