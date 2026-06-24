export const dynamic='force-dynamic';
import{NextRequest,NextResponse}from'next/server';
import{getServerSession}from'next-auth';
import{authOptions}from'@/lib/auth';
import{prisma}from'@/lib/prisma';
export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){
  const session=await getServerSession(authOptions);
  if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const{subject,startTime,endTime,date}=await req.json();
    const updated=await prisma.classSession.update({where:{id:params.id},data:{...(subject?{subject:subject.trim()}:{}),...(startTime?{startTime}:{}),...(endTime?{endTime}:{}),...(date?{date:new Date(date)}:{})},include:{attendance:true,notes:true,mediaUploads:true}});
    return NextResponse.json({session:updated});
  }catch(err){return NextResponse.json({error:'Update failed'},{status:500});}
}
export async function DELETE(_req:NextRequest,{params}:{params:{id:string}}){
  const session=await getServerSession(authOptions);
  if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  try{await prisma.classSession.delete({where:{id:params.id}});return NextResponse.json({success:true});}
  catch(err){return NextResponse.json({error:'Delete failed'},{status:500});}
}
