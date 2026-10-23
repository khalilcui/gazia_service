/* ==========================================================
   Default content — everything taken from the original site
   (gazia-services-website.vercel.app). The admin panel edits a
   copy of this; saved edits are stored on the server.
   ========================================================== */
import type { Content } from "./types";

const ORIGINAL = "https://gazia-services-website.vercel.app/assets/";

/** If a local images/ file is missing, the original site's copy is used. */
export const IMAGE_FALLBACK: Record<string, string> = {
  "hero-bg.jpg": ORIGINAL + "hero-bg-C5WEVfg2.jpg",
  "work-graphic.jpg": ORIGINAL + "work-graphic-CW5W0IcE.jpg",
  "work-presentation.jpg": ORIGINAL + "work-presentation-B0RYTSOj.jpg",
  "work-canva.jpg": ORIGINAL + "work-canva-CSmjnQ2F.jpg",
  "work-marketing.jpg": ORIGINAL + "work-marketing-C_ZGSwNU.jpg",
  "work-cv.jpg": ORIGINAL + "work-cv-DvTdl4XF.jpg"
};

export const DEFAULT_CONTENT: Content = {
  site: {
    brand: "Gazia",
    title: "Gazia — Design, Digital & Admin Services",
    description: "Premium design, Canva templates, presentations, CVs and digital admin support. Based in Luton, England — available for new projects."
  },
  hero: {
    available: "Available for work",
    eyebrow: "Service Website",
    firstName: "GAZIA",
    lastName: "HUSSAIN",
    intro: "Design, digital and admin support by Gazia — from Canva graphics to polished presentations, CVs and organised documents.",
    location: "Luton, England",
    responseTime: "Replies within 24 hours",
    primary: { label: "Explore services", href: "/services" },
    secondary: { label: "View my work", href: "/work" },
    photo: "",
    backdrop: "images/hero-bg.jpg",
    screenTitle: "Gazia Studio",
    screenText: "Design · Digital · Admin"
  },
  stats: [
    { value: 25, suffix: "+", label: "Projects Completed" },
    { value: 15, suffix: "+", label: "Happy Clients" },
    { value: 7, suffix: "", label: "Years Learning" },
    { value: 23, suffix: "", label: "Skills" }
  ],
  about: {
    eyebrow: "About me",
    heading: "Learning, building, growing.",
    sub: "A short story about where I've studied, what I've learned and how I like to work.",
    greeting: "Hi, I'm Gazia.",
    story: [
      "Hi, I'm Gazia, a 19-year-old student from Luton, England. I enjoy learning new things, improving my skills, and taking on new challenges that help me grow both personally and professionally.",
      "I completed my education at Challney High School for Girls in Luton, Bedfordshire, where I studied from 2018 to 2023. I am now continuing my education at Luton Sixth Form College, where I studied from 2023 to 2025. During my studies, I have developed strong knowledge, confidence, and valuable life skills.",
      "I have built a range of skills that help me work well with others and stay organized. These include communication, organisation, research, time management, time keeping, collaboration, and teamwork. I enjoy working with people, sharing ideas, and completing tasks responsibly.",
      "I also have good IT skills and enjoy using digital tools. I am confident with Canva, Digital Marketing, Microsoft Office applications, Edexcel Systems, and other digital platforms for learning and productivity.",
      "I am always willing to learn, improve my abilities, and gain new experiences. My goal is to continue growing my knowledge, develop new skills, and make a positive contribution in everything I do."
    ],
    facts: [
      { label: "Based in", value: "Luton, England" },
      { label: "Studied at", value: "Luton Sixth Form" },
      { label: "Focus", value: "Design & digital" },
      { label: "Working style", value: "Organised & on time" }
    ]
  },
  education: [
    { period: "2018 – 2023", school: "Challney High School for Girls", place: "Luton, Bedfordshire", text: "Built strong foundations in communication, organisation and teamwork." },
    { period: "2023 – 2025", school: "Luton Sixth Form College", place: "Luton, Bedfordshire", text: "Developed confidence, research skills and practical digital ability." }
  ],
  skills: {
    heading: "Skills that keep work moving.",
    sub: "Professional strengths on one side, practical digital ability on the other.",
    featuredTitle: "What I bring to a project",
    featured: [
      { icon: "chat", title: "Verbal & written communication", category: "Professional", level: 92 },
      { icon: "calendar", title: "Organisation & planning", category: "Professional", level: 90 },
      { icon: "search", title: "Research & information gathering", category: "Professional", level: 88 },
      { icon: "palette", title: "Canva", category: "IT & Digital", level: 93 },
      { icon: "megaphone", title: "Digital Marketing", category: "IT & Digital", level: 82 },
      { icon: "doc", title: "Microsoft Word", category: "IT & Digital", level: 92 }
    ],
    professional: [
      { name: "Verbal & written communication", level: 92 },
      { name: "Organisation & planning", level: 90 },
      { name: "Research & information gathering", level: 88 },
      { name: "Time management", level: 89 },
      { name: "Time keeping & punctuality", level: 95 },
      { name: "Collaboration & teamwork", level: 93 },
      { name: "Problem-solving & critical thinking", level: 86 },
      { name: "Adaptability & willingness to learn", level: 94 },
      { name: "Attention to detail", level: 90 },
      { name: "Customer service & interpersonal skills", level: 88 }
    ],
    it: [
      { name: "Canva", level: 93 },
      { name: "Digital Marketing", level: 82 },
      { name: "Microsoft Word", level: 92 },
      { name: "Microsoft Excel", level: 85 },
      { name: "Microsoft PowerPoint", level: 90 },
      { name: "Microsoft Outlook", level: 88 },
      { name: "Edexcel Systems", level: 84 },
      { name: "Internet Research", level: 91 },
      { name: "Email Communication", level: 90 },
      { name: "Digital Productivity Tools", level: 87 },
      { name: "Online Learning Platforms", level: 89 },
      { name: "Basic Data Entry", level: 86 },
      { name: "File Management", level: 88 }
    ]
  },
  languages: {
    heading: "Languages I speak",
    sub: "Comfortable working with clients across communities.",
    items: [
      { flag: "🇬🇧", name: "English", level: "Fluent" },
      { flag: "🇵🇰", name: "Urdu", level: "Fluent" },
      { flag: "🗣️", name: "Pahari", level: "Conversational" },
      { flag: "💬", name: "Pahari-Pothwari", level: "Conversational" }
    ]
  },
  services: {
    heading: "Everything I can help with.",
    sub: "Clear scope, tidy files and work delivered when I say it will be.",
    items: [
      { id: "graphic-design", icon: "pen", title: "Graphic Design", text: "Clean, on-brand visuals built for print and screen.", points: [] },
      { id: "canva-designs", icon: "palette", title: "Canva Designs", text: "Editable Canva templates you can reuse forever.", points: [] },
      { id: "digital-marketing", icon: "megaphone", title: "Digital Marketing", text: "Content and campaign support that keeps posting simple.", points: [] },
      { id: "office-support", icon: "grid", title: "Microsoft Office Support", text: "Word, Excel, PowerPoint and Outlook done properly.", points: [] },
      { id: "cv-portfolio", icon: "idcard", title: "CV & Portfolio Design", text: "Standout CVs and portfolios that read in seconds.", points: [] },
      { id: "presentations", icon: "slides", title: "Presentation Design", text: "Slides with a clear story and confident visuals.", points: [] },
      { id: "document-formatting", icon: "doc", title: "Document Formatting", text: "Consistent styles, spacing and structure throughout.", points: [] },
      { id: "research", icon: "search", title: "Research Assistance", text: "Sourced, summarised and organised research.", points: [] },
      { id: "email-support", icon: "mail", title: "Email Support", text: "Professional replies and a tidy inbox.", points: [] },
      { id: "productivity", icon: "list", title: "Productivity Assistance", text: "Systems, trackers and checklists that keep work moving.", points: [] }
    ],
    ctaTitle: "Need something else?",
    ctaText: "Tell me what you have in mind and I'll let you know how I can help.",
    ctaLabel: "Start a conversation"
  },
  work: {
    heading: "Selected work.",
    sub: "Filter by category, then open a project to see the details.",
    items: [
      { image: "images/work-graphic.jpg", title: "Brand Poster Set", category: "Graphic Designs", text: "", link: "" },
      { image: "images/work-presentation.jpg", title: "Business Deck", category: "Presentations", text: "", link: "" },
      { image: "images/work-canva.jpg", title: "Social Template Pack", category: "Canva Projects", text: "", link: "" },
      { image: "images/work-marketing.jpg", title: "Campaign Report", category: "Digital Marketing", text: "", link: "" },
      { image: "images/work-cv.jpg", title: "Modern CV Layout", category: "CV Designs", text: "", link: "" }
    ]
  },
  feedback: {
    heading: "What clients say",
    text: "Worked with me? Rate the service and leave a few words — it helps other clients decide.",
    items: []
  },
  contact: {
    heading: "Let's talk about your project.",
    text: "Fill in the form and I'll reply personally — usually the same day.",
    email: "gaziahussain2006@gmail.com",
    phone: "",
    location: "Luton, England",
    responseTime: "Within 24 hours",
    linkedin: "https://www.linkedin.com",
    instagram: "https://www.instagram.com",
    facebook: "https://www.facebook.com",
    motto: "Let's work together"
  },
  footer: {
    tagline: "Design, digital and admin support — delivered on time and made to look good.",
    note: "All rights reserved.",
    ctaLabel: "Start a project"
  },
  sections: { about: true, skills: true, languages: true, services: true, work: true, feedback: true, contact: true }
};
