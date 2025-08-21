import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Milestone definitions
const MILESTONES = [
  { days: 1, name: '첫 만남', type: 'special' },
  { days: 7, name: '일주일', type: 'weekly' },
  { days: 14, name: '2주', type: 'weekly' },
  { days: 30, name: '한 달', type: 'monthly' },
  { days: 50, name: '50일', type: 'special' },
  { days: 100, name: '100일', type: 'major' },
  { days: 200, name: '200일', type: 'major' },
  { days: 300, name: '300일', type: 'major' },
  { days: 365, name: '1년', type: 'anniversary' },
  { days: 500, name: '500일', type: 'major' },
  { days: 730, name: '2년', type: 'anniversary' },
  { days: 1000, name: '1000일', type: 'major' },
  { days: 1095, name: '3년', type: 'anniversary' },
  { days: 1460, name: '4년', type: 'anniversary' },
  { days: 1825, name: '5년', type: 'anniversary' }
];

function calculateMilestones(relationshipStartDate: Date) {
  const now = new Date();
  const startDate = new Date(relationshipStartDate);
  const daysTogether = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const milestones = MILESTONES.map(milestone => {
    const milestoneDate = new Date(startDate);
    milestoneDate.setDate(milestoneDate.getDate() + milestone.days);
    
    const isPassed = daysTogether >= milestone.days;
    const isUpcoming = !isPassed && daysTogether >= (milestone.days - 7); // Within 7 days
    const daysUntil = milestone.days - daysTogether;
    
    return {
      ...milestone,
      date: milestoneDate,
      isPassed,
      isUpcoming,
      daysUntil: isPassed ? 0 : daysUntil,
      daysTogether: isPassed ? milestone.days : 0
    };
  });
  
  return {
    daysTogether,
    milestones,
    nextMilestone: milestones.find(m => !m.isPassed),
    recentMilestones: milestones.filter(m => m.isPassed).slice(-3),
    upcomingMilestones: milestones.filter(m => m.isUpcoming)
  };
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user?.relationshipStartDate) {
      return NextResponse.json({ 
        error: 'Relationship start date not set' 
      }, { status: 400 });
    }

    const milestoneData = calculateMilestones(user.relationshipStartDate);

    return NextResponse.json({ 
      data: milestoneData, 
      success: true 
    });
  } catch (error) {
    console.error('Error calculating milestones:', error);
    return NextResponse.json(
      { error: 'Failed to calculate milestones' },
      { status: 500 }
    );
  }
}