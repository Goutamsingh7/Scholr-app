export const dynamic='force-dynamic';
import{NextResponse}from'next/server';
import{getServerSession}from'next-auth';
import{authOptions}from'@/lib/auth';
import{prisma}from'@/lib/prisma';
export async function GET(){
  const session=await getServerSession(authOptions);
  if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const userId=(session.user as any).id;
  try{
    const timetable=await prisma.timetable.findFirst({where:{userId},select:{id:true,createdAt:true,startDate:true,endDate:true}});
    if(!timetable)return NextResponse.json({exists:false});
    const sessionCount=await prisma.classSession.count({where:{timetableId:timetable.id}});
    const markedCount=await prisma.attendance.count({where:{classSession:{timetableId:timetable.id}}});
    return NextResponse.json({exists:true,createdAt:timetable.createdAt,startDate:timetable.startDate,endDate:timetable.endDate,sessionCount,markedCount});
  }catch{return NextResponse.json({error:'Server error'},{status:500});}
}
