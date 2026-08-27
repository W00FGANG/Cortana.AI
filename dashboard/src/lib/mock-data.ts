import { LineChart, Megaphone, ClipboardList, Search } from "lucide-react";

export const workers = [
  {
    id: "kai",
    name: "Kai",
    role: "Sales Outreach Agent",
    description: "Kai identifies qualified prospects, prepares personalized outreach, organizes follow-ups, and helps Zumify maintain a consistent sales pipeline.",
    status: "Active",
    currentTask: "Prepare personalized outreach for 5 qualified prospects.",
    completed: 3,
    lastRun: "Today, 10:31 AM",
    nextRun: "Tomorrow, 8:00 AM",
    schedule: "Weekdays — 8:00 AM",
    icon: LineChart,
    color: "bg-blue-50 text-blue-700",
    borderColor: "border-blue-200",
    capabilities: [
      "Lead Qualification",
      "Prospect Research",
      "Email Drafting",
      "Follow-up Management"
    ]
  },
  {
    id: "maya",
    name: "Maya",
    role: "Marketing Agent",
    description: "Maya helps Zumify plan, research, and create marketing content across social media, website content, campaigns, and brand communications.",
    status: "Active",
    currentTask: "Generate this week's LinkedIn content ideas.",
    completed: 2,
    lastRun: "Today, 9:45 AM",
    nextRun: "Tomorrow, 9:00 AM",
    schedule: "Monday–Friday — 9:00 AM",
    icon: Megaphone,
    color: "bg-purple-50 text-purple-700",
    borderColor: "border-purple-200",
    capabilities: [
      "Social Media Ideas",
      "Content Planning",
      "Marketing Research",
      "Campaign Ideas"
    ]
  },
  {
    id: "nora",
    name: "Nora",
    role: "Administration Agent",
    description: "Nora helps keep Zumify's internal operations organized by tracking administrative tasks, deadlines, documents, reminders, and recurring business operations.",
    status: "Active",
    currentTask: "Review upcoming administrative tasks.",
    completed: 4,
    lastRun: "Today, 9:00 AM",
    nextRun: "Monday, 8:00 AM",
    schedule: "Monday — 8:00 AM",
    icon: ClipboardList,
    color: "bg-emerald-50 text-emerald-700",
    borderColor: "border-emerald-200",
    capabilities: [
      "Administrative Reminders",
      "Task Organization",
      "Deadline Tracking",
      "Document Reminders"
    ]
  },
  {
    id: "atlas",
    name: "Atlas",
    role: "Research & Lead Intelligence Agent",
    description: "Atlas researches businesses, industries, competitors, market opportunities, and potential Zumify prospects.",
    status: "Active",
    currentTask: "Find 10 Hawaii businesses that may need a website redesign.",
    completed: 5,
    lastRun: "Today, 10:42 AM",
    nextRun: "Tomorrow, 10:00 AM",
    schedule: "Weekdays — 10:00 AM",
    icon: Search,
    color: "bg-amber-50 text-amber-700",
    borderColor: "border-amber-200",
    capabilities: [
      "Business Research",
      "Lead Discovery",
      "Competitor Research",
      "Market Research"
    ]
  },
];
