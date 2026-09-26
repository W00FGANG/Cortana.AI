import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data from Supabase...');
  await prisma.approval.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.task.deleteMany();
  await prisma.agent.deleteMany();

  console.log('Seeding Supabase database with Cortana.AI / Zumify AI OS workforce...');

  // 1. Create Agents
  const kai = await prisma.agent.create({
    data: {
      name: 'Kainoa',
      role: 'Sales Outreach Agent',
      description: 'Kainoa identifies qualified prospects, prepares personalized outreach, organizes follow-ups, and helps Zumify maintain a consistent sales pipeline.',
      systemPrompt: 'You are Kainoa, a professional Sales Outreach Agent for Zumify LLC. Your goal is to identify prospects and prepare personalized, highly converting outreach messages.',
      capabilities: ['Lead Qualification', 'Prospect Research', 'Email Drafting', 'Follow-up Management'],
      schedule: 'Weekdays — 8:00 AM',
      avatar: '/assets/KainoaProfile.jpg',
      status: 'Active',
      n8nWorkflowId: 'Al3atlOTCSx8ZNgN',
    },
  });

  const maya = await prisma.agent.create({
    data: {
      name: 'Maya',
      role: 'Marketing Agent',
      description: 'Maya helps Zumify plan, research, and create marketing content across social media, website content, campaigns, and brand communications.',
      systemPrompt: 'You are Maya, a creative Marketing Agent for Zumify LLC. Your goal is to write engaging LinkedIn posts and research modern digital marketing trends.',
      capabilities: [
        'Social Media Research',
        'Viral Trend Analysis',
        'Short-Form Video Concepts',
        'Live Market Scraping',
        'Content Planning'
      ],
      schedule: 'Monday–Friday — 9:00 AM',
      avatar: '/assets/MayaProfile.jpg',
      status: 'Active',
      n8nWorkflowId: '6SfepVmMljnVsWBG',
    },
  });

  const nora = await prisma.agent.create({
    data: {
      name: 'Nora',
      role: 'Administration Agent',
      description: 'Nora helps keep Zumify\'s internal operations organized by tracking administrative tasks, deadlines, documents, reminders, and recurring business operations.',
      systemPrompt: 'You are Nora, a highly organized Administration Agent for Zumify LLC. Your goal is to organize internal tasks and remind the team of deadlines.',
      capabilities: ['Administrative Reminders', 'Task Organization', 'Deadline Tracking', 'Document Reminders'],
      schedule: 'Monday — 8:00 AM',
      avatar: '/assets/NoraProfile.jpg',
      status: 'Active',
    },
  });

  const kent = await prisma.agent.create({
    data: {
      name: 'Kent',
      role: 'Research & Lead Intelligence Agent',
      description: 'Kent researches businesses, industries, competitors, market opportunities, and potential Zumify prospects.',
      systemPrompt: 'You are Kent, a meticulous Research Agent for Zumify LLC. Your goal is to find local Hawaii businesses with outdated websites and analyze competitors.',
      capabilities: ['Business Research', 'Lead Discovery', 'Competitor Research', 'Market Research'],
      schedule: 'Weekdays — 10:00 AM',
      avatar: '/assets/KentProfile.jpg',
      status: 'Active',
    },
  });

  const harper = await prisma.agent.create({
    data: {
      name: 'Harper',
      role: 'Deep-Research Article Writer',
      description: 'Harper autonomously conducts web research, gathers authoritative citations, curates open source photography, and drafts publication-ready articles with SEO optimization.',
      capabilities: [
        'Web Research',
        'Open Source Images',
        'SEO Optimization',
        'Article Generation'
      ],
      schedule: 'On-demand',
      avatar: '/assets/HarperProfile.jpg',
      status: 'Active',
      n8nWorkflowId: '1DElnhi9xf3iwYcp',
    },
  });

  console.log('Created 5 Agents (Kai, Maya, Nora, Kent, Harper)');

  // 2. Create Tasks
  const taskMaya1 = await prisma.task.create({
    data: {
      agentId: maya.id,
      title: "Generate this week's LinkedIn content ideas.",
      description: 'Develop 5 actionable B2B LinkedIn posts highlighting AI automation benefits.',
      status: 'Completed',
      priority: 'Medium',
      scheduledFor: new Date(),
      completedAt: new Date(),
      result: '5 LinkedIn draft posts created successfully.',
    },
  });

  const taskMaya2 = await prisma.task.create({
    data: {
      agentId: maya.id,
      title: 'Publish Hawaii Small Business AI Guide on LinkedIn',
      description: 'Social post discussing AI transformation for local enterprises.',
      status: 'Needs Approval',
      priority: 'Medium',
      requiresApproval: true,
      scheduledFor: new Date(),
    },
  });

  const taskNora1 = await prisma.task.create({
    data: {
      agentId: nora.id,
      title: 'Review upcoming administrative tasks and filing deadlines.',
      description: 'Check calendar and compliance requirements for Q3.',
      status: 'Completed',
      priority: 'Low',
      scheduledFor: new Date(),
      completedAt: new Date(),
      result: 'All deadlines categorized and logged.',
    },
  });

  const taskKent1 = await prisma.task.create({
    data: {
      agentId: kent.id,
      title: 'Find 10 Hawaii businesses that may need a website redesign.',
      description: 'Analyze local Hawaii service businesses with non-mobile friendly web assets.',
      status: 'Completed',
      priority: 'Medium',
      scheduledFor: new Date(),
      completedAt: new Date(),
      result: 'Identified 10 target companies with verified contact details.',
    },
  });

  const taskKent2 = await prisma.task.create({
    data: {
      agentId: kent.id,
      title: 'Analyze competitor pricing and packaging across Honolulu agencies',
      description: 'Gather public agency rates and service tiers.',
      status: 'Pending',
      priority: 'Medium',
      scheduledFor: new Date(Date.now() + 86400000),
    },
  });

  console.log('Created Tasks');

  // 3. Create Agent Runs
  await prisma.agentRun.createMany({
    data: [
      {
        agentId: kent.id,
        taskId: taskKent1.id,
        status: 'Completed',
        startedAt: new Date(Date.now() - 45 * 60 * 1000),
        completedAt: new Date(Date.now() - 40 * 60 * 1000),
        input: 'Search queries: "Hawaii contractors", "Honolulu boutique shops"',
        output: 'Found 10 qualified targets with Google PageSpeed < 40.',
      },
      {
        agentId: maya.id,
        taskId: taskMaya1.id,
        status: 'Completed',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 110 * 60 * 1000),
        input: 'Topic: How AI operations cut overhead by 40%',
        output: 'Generated 5 high-engagement post concepts.',
      },
      {
        agentId: nora.id,
        taskId: taskNora1.id,
        status: 'Completed',
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 170 * 60 * 1000),
        input: 'Fetch calendar items and quarterly tax calendar',
        output: '4 items pending review, no immediate blockers.',
      },
    ],
  });

  console.log('Created Agent Runs');

  // 4. Create Activity Logs
  await prisma.activity.createMany({
    data: [
      {
        agentId: kent.id,
        action: 'Discovered 10 potential Hawaii business prospects',
        description: 'Identified opportunities with outdated digital presence',
        status: 'Success',
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
      },
      {
        agentId: maya.id,
        action: 'Completed marketing research & LinkedIn drafts',
        description: 'Scheduled 5 content drafts for team review',
        status: 'Success',
        createdAt: new Date(Date.now() - 110 * 60 * 1000),
      },
      {
        agentId: nora.id,
        action: 'Created an administrative reminder for quarterly filings',
        description: 'Calendar event created and notification sent',
        status: 'Success',
        createdAt: new Date(Date.now() - 170 * 60 * 1000),
      },
    ],
  });

  console.log('Created Activities');

  // 5. Create Pending Approvals
  await prisma.approval.create({
    data: {
      agentId: maya.id,
      taskId: taskMaya2.id,
      title: 'Publish LinkedIn Post to Zumify Page',
      content: 'Is your agency leveraging AI to automate daily operations? Discover how the new Zumify AI OS is helping small businesses in Hawaii scale effortlessly. #AI #Automation #HawaiiTech',
      status: 'Pending',
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
  });

  console.log('Created Approvals');
  console.log('Supabase seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
