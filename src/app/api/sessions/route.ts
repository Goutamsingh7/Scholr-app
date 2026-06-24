export const dynamic='force-dynamic';
import{NextRequest,NextResponse}from'next/server';
import{getServerSession}from'next-auth';
import{authOptions}from'@/lib/auth';
import{prisma}from'@/lib/prisma';
export async function GET(req:NextRequest){
  const session=await getServerSession(authOptions);
  if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const userId=(session.user as any).id;
  const{searchParams}=new URL(req.url);
  const weekStart=searchParams.get('weekStart'),weekEnd=searchParams.get('weekEnd'),all=searchParams.get('all')==='true',dateStr=searchParams.get('date');
  try{
    const timetable=await prisma.timetable.findFirst({where:{userId}});
    if(!timetable)return NextResponse.json({sessions:[],hasTimetable:false});
    const where:any={timetableId:timetable.id};
    if(dateStr){const d=new Date(dateStr);d.setHours(0,0,0,0);const d2=new Date(d);d2.setHours(23,59,59,999);where.date={gte:d,lte:d2};}
    else if(!all&&weekStart&&weekEnd){where.date={gte:new Date(weekStart),lte:new Date(weekEnd)};}
    else if(!all){const today=new Date();today.setHours(0,0,0,0);const next14=new Date(today);next14.setDate(today.getDate()+14);where.date={gte:today,lte:next14};}
    const sessions=await prisma.classSession.findMany({where,orderBy:[{date:'asc'},{startTime:'asc'}],include:{attendance:true,notes:{select:{id:true,content:true,createdAt:true}},mediaUploads:true},...(all?{}:{take:200})});
    return NextResponse.json({sessions,hasTimetable:true});
  }catch(err){console.error(err);return NextResponse.json({error:'Server error'},{status:500});}
}
export async function POST(req:NextRequest){
  const session=await getServerSession(authOptions);
  if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const userId=(session.user as any).id;
  try{
    const{date,subject,startTime,endTime}=await req.json();
    if(!date||!subject||!startTime||!endTime)return NextResponse.json({error:'All fields required'},{status:400});
    const timetable=await prisma.timetable.findFirst({where:{userId}});
    if(!timetable)return NextResponse.json({error:'No timetable found'},{status:404});
    const newSession=await prisma.classSession.create({data:{timetableId:timetable.id,date:new Date(date),subject:subject.trim(),startTime,endTime},include:{attendance:true,notes:true,mediaUploads:true}});
    return NextResponse.json({session:newSession});
  }catch(err){console.error(err);return NextResponse.json({error:'Failed to add class'},{status:500});}
}
