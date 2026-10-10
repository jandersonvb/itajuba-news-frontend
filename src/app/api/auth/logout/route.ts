import {NextRequest,NextResponse} from 'next/server';
import {sameOrigin} from '@/lib/proxy';
import {clearSessionCookie} from '@/lib/session';
export async function POST(req:NextRequest){if(!sameOrigin(req))return NextResponse.json({message:'Origem inválida'},{status:403});const response=NextResponse.json({ok:true});clearSessionCookie(response);return response;}
