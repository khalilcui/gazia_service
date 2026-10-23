/* Shape of all editable website content. */

export interface Link { label: string; href: string }
export interface Stat { value: number; suffix: string; label: string }
export interface Fact { label: string; value: string }
export interface Education { period: string; school: string; place: string; text: string }
export interface FeaturedSkill { icon: string; title: string; category: string; level: number }
export interface SkillLevel { name: string; level: number }
export interface Language { flag: string; name: string; level: string }
export interface Service { id: string; icon: string; title: string; text: string; points: string[] }
export interface WorkItem { image: string; title: string; category: string; text: string; link: string }
export interface FeedbackItem { id?: string; name: string; role: string; rating: number; message: string; created_at?: string; approved?: boolean }

export interface Content {
  site: { brand: string; title: string; description: string };
  hero: {
    available: string; eyebrow: string; firstName: string; lastName: string; intro: string;
    location: string; responseTime: string; primary: Link; secondary: Link; photo: string; backdrop: string; screenTitle: string; screenText: string;
  };
  stats: Stat[];
  about: { eyebrow: string; heading: string; sub: string; greeting: string; story: string[]; facts: Fact[] };
  education: Education[];
  skills: { heading: string; sub: string; featuredTitle: string; featured: FeaturedSkill[]; professional: SkillLevel[]; it: SkillLevel[] };
  languages: { heading: string; sub: string; items: Language[] };
  services: { heading: string; sub: string; items: Service[]; ctaTitle: string; ctaText: string; ctaLabel: string };
  work: { heading: string; sub: string; items: WorkItem[] };
  feedback: { heading: string; text: string; items: FeedbackItem[] };
  contact: {
    heading: string; text: string; email: string; phone: string; location: string; responseTime: string;
    linkedin: string; instagram: string; facebook: string; motto: string;
  };
  footer: { tagline: string; note: string; ctaLabel: string };
  sections: Record<string, boolean>;
}

export interface Theme { id: string; name: string; group?: string; a1: string; a2: string; a3: string; bg: string; bg2: string; light?: boolean }
