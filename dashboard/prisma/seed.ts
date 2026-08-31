import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with Zumify AI OS mock data...')

  const agents = [
    {
      name: 'Kainoa',
      role: 'Sales Outreach Agent',
      description: 'Kainoa identifies qualified prospects, prepares personalized outreach, organizes follow-ups, and helps Zumify maintain a consistent sales pipeline.',
      systemPrompt: 'You are Kainoa, a professional Sales Outreach Agent for Zumify LLC. Your goal is to identify prospects and prepare personalized, highly converting outreach messages.',
      capabilities: ['Lead Qualification', 'Prospect Research', 'Email Drafting', 'Follow-up Management'],
      schedule: 'Weekdays — 8:00 AM',
      avatar: '/assets/KainoaProfile.jpg',
      status: 'Active',
    },
    {
      name: 'Maya',
      role: 'Marketing Agent',
      description: 'Maya helps Zumify plan, research, and create marketing content across social media, website content, campaigns, and brand communications.',
      systemPrompt: 'You are Maya, a creative Marketing Agent for Zumify LLC. Your goal is to write engaging LinkedIn posts and research modern digital marketing trends.',
      capabilities: ['Social Media Ideas', 'Content Planning', 'Marketing Research', 'Campaign Ideas'],
      schedule: 'Monday–Friday — 9:00 AM',
      avatar: '/assets/MayaProfile.jpg',
      status: 'Active',
    },
    {
      name: 'Nora',
      role: 'Administration Agent',
      description: 'Nora helps keep Zumify\'s internal operations organized by tracking administrative tasks, deadlines, documents, reminders, and recurring business operations.',
      systemPrompt: 'You are Nora, a highly organized Administration Agent for Zumify LLC. Your goal is to organize internal tasks and remind the team of deadlines.',
      capabilities: ['Administrative Reminders', 'Task Organization', 'Deadline Tracking', 'Document Reminders'],
      schedule: 'Monday — 8:00 AM',
      avatar: '/assets/NoraProfile.jpg',
      status: 'Active',
    },
    {
      name: 'Kent',
      role: 'Research & Lead Intelligence Agent',
      description: 'Kent researches businesses, industries, competitors, market opportunities, and potential Zumify prospects.',
      systemPrompt: 'You are Kent, a meticulous Research Agent for Zumify LLC. Your goal is to find local Hawaii businesses with outdated websites and analyze competitors.',
      capabilities: ['Business Research', 'Lead Discovery', 'Competitor Research', 'Market Research'],
      schedule: 'Weekdays — 10:00 AM',
      avatar: '/assets/KentProfile.jpg',
      status: 'Active',
    }
  ]

  for (const agentData of agents) {
    const agent = await prisma.agent.create({
      data: agentData
    })
    console.log(`Created agent: ${agent.name}`)
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
