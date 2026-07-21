export const SITE = {
  name: "City Dental Clinic",
  legalName: "City Multispeciality Dental Hospital",
  tagline: "Healthy Smiles, Happy Lives",
  established: 2000,
  address:
    "Shop No #1, KR & MS Reddy Complex, Near Vijay Talkies Road, Hanamkonda Chowrastha, Hanamkonda, Warangal-506001, Telangana, India",
  city: "Hanamkonda, Warangal",
  callNow: "+919030493936",
  callNowDisplay: "+91 90304 93936",
  phones: [
    { label: "Emergency / Call Now", value: "+919849567318", display: "+91 98495 67318" },
    { label: "Reception", value: "+919030493936", display: "+91 90304 93936" },
    { label: "Appointments", value: "+919030493936", display: "+91 90304 93936" },
  ],
  hours: [
    { day: "Monday – Saturday", value: "9:00 AM – 8:00 PM" },
    { day: "Sunday", value: "Closed" },
  ],
  whatsapp: "919030493936",
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
      "With 26+ years of clinical experience, Dr. Manoranjan is known for his gentle chair-side manner and precise, single-visit root canal technique.",
    specializations: [
      "Single Visit Root Canal Treatment",
      "Cosmetic Dentistry & Smile Makeovers",
      "Dental Crowns & Bridges",
      "Post & Core Treatment",
      "Re-Root Canal Treatment",
      "Dental Veneers & Laminates",
    ],
    memberships: ["Indian Dental Association"],
  },
  {
    slug: "srujana-kota",
    name: "Dr. Srujana Kota",
    qualifications: "BDS, FAGE (Manipal)",
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
    memberships: ["Indian Dental Association"],
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
    a: "We are open Monday to Saturday, 9:00 AM to 9:00 PM. The clinic is closed on Sundays. Emergency care is available 24/7 — call +91 90304 93936.",
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
    q: "How much does teeth whitening cost?",
    a: "In-clinic professional teeth whitening starts at ₹2,999. Your dentist will confirm the exact plan after a short consultation.",
  },
  {
    q: "Is the clinic child-friendly?",
    a: "Absolutely. Dr. Srujana specialises in pediatric dentistry and our team is trained to keep children calm, safe and smiling.",
  },
];
