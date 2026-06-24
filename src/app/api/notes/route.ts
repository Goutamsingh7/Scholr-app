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
  const classSessionId=searchParams.get('sessionId'),all=searchParams.get('all')==='true';
  try{
    if(all){
      const timetable=await prisma.timetable.findFirst({where:{userId}});
      if(!timetable)return NextResponse.json({sessions:[]});
      const sessions=await prisma.classSession.findMany({where:{timetableId:timetable.id,notes:{some:{}}},include:{notes:{orderBy:{createdAt:'desc'}}},orderBy:[{date:'asc'}]});
      return NextResponse.json({sessions});
    }
    const notes=await prisma.note.findMany({where:{classSessionId:classSessionId??undefined},orderBy:{createdAt:'desc'}});
    return NextResponse.json({notes});
  }catch{return NextResponse.json({error:'Server error'},{status:500});}
}

export async function POST(req:NextRequest){
  const session=await getServerSession(authOptions);
  if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const{classSessionId,content,imageData}=await req.json();
    if(!classSessionId||!content?.trim())return NextResponse.json({error:'Missing fields'},{status:400});
    const note=await prisma.note.create({data:{classSessionId,content:content.trim(),imageData:imageData??null}});
    return NextResponse.json({note});
  }catch{return NextResponse.json({error:'Server error'},{status:500});}
}

export async function PATCH(req:NextRequest){
  const session=await getServerSession(authOptions);
  if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const{id,content}=await req.json();
    if(!id||!content?.trim())return NextResponse.json({error:'Missing fields'},{status:400});
    const note=await prisma.note.update({where:{id},data:{content:content.trim()}});
    return NextResponse.json({note});
  }catch{return NextResponse.json({error:'Server error'},{status:500});}
}

export async function DELETE(req:NextRequest){
  const session=await getServerSession(authOptions);
  if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const{searchParams}=new URL(req.url);
  const id=searchParams.get('id');
  try{await prisma.note.delete({where:{id:id??''}});return NextResponse.json({success:true});}
  catch{return NextResponse.json({error:'Server error'},{status:500});}
}
