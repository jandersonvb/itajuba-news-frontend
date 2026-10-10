import {NextRequest,NextResponse} from 'next/server';
import {sameOrigin} from '@/lib/proxy';
export async function POST(req:NextRequest){if(!sameOrigin(req))return NextResponse.json({message:'Origem inválida'},{status:403});const response=NextResponse.json({ok:true});response.cookies.set('itajuba-session','',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',maxAge:0,path:'/'});return response;}
