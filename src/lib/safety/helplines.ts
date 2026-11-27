import { EmergencyHelpline } from "@/types/safety";

export const VERIFIED_HELPLINES: EmergencyHelpline[] = [
  {
    id: "tele-manas",
    name: "Tele-MANAS (Govt. of India)",
    number: "14416",
    availableHours: "24/7 Toll-Free",
    description: "National Tele Mental Health Programme providing free support across India in 20+ languages.",
    languages: ["Hindi", "English", "Regional"],
    website: "https://telemanas.mohfw.gov.in",
    country: "IN",
  },
  {
    id: "kiran",
    name: "KIRAN Mental Health Helpline",
    number: "1800-599-0019",
    availableHours: "24/7 Toll-Free",
    description: "Ministry of Social Justice and Empowerment helpline for mental health rehabilitation.",
    languages: ["Hindi", "English", "Regional"],
    country: "IN",
  },
  {
    id: "vandrevala",
    name: "Vandrevala Foundation",
    number: "+91 9999 666 555",
    availableHours: "24/7 Free",
    description: "Free, confidential mental health counseling via voice call and WhatsApp.",
    languages: ["Hindi", "English", "Gujarati", "Marathi"],
    website: "https://www.vandrevalafoundation.com",
    country: "IN",
  },
  {
    id: "emergency-india",
    name: "National Emergency Number",
    number: "112",
    availableHours: "24/7 Immediate",
    description: "All-in-one emergency response for medical, police, and fire distress across India.",
    languages: ["All Indian Languages"],
    country: "IN",
  },
  {
    id: "us-988",
    name: "988 Suicide & Crisis Lifeline",
    number: "988",
    availableHours: "24/7 Call/Text",
    description: "Free, confidential support for anyone in suicidal crisis or emotional distress in the US & Canada.",
    languages: ["English", "Spanish"],
    website: "https://988lifeline.org",
    country: "US",
  },
  {
    id: "befrienders-global",
    name: "Befrienders Worldwide",
    number: "befrienders.org",
    availableHours: "Global Directory",
    description: "International network of volunteer emotional support centers worldwide.",
    languages: ["Global"],
    website: "https://www.befrienders.org",
    country: "GLOBAL",
  },
];

export function getHelplinesForRegion(countryCode?: string): EmergencyHelpline[] {
  if (countryCode === "US" || countryCode === "CA") {
    return VERIFIED_HELPLINES.filter((h) => h.country === "US" || h.country === "GLOBAL");
  }
  // Default to Indian helplines + Global directory
  return VERIFIED_HELPLINES.filter((h) => h.country === "IN" || h.country === "GLOBAL");
}

