import {NextRequest,NextResponse} from 'next/server';
import {proxy,resources} from '@/lib/proxy';
async function handler(req:NextRequest,{params}:{params:Promise<{resource:string;id:string}>}){const {resource,id}=await params;if(!resources.includes(resource)||!/^[-a-f0-9]{36}$/.test(id)||(req.method==='PATCH'&&resource==='leads'))return NextResponse.json({message:'Recurso inválido'},{status:404});return proxy(req,'/admin/'+resource+'/'+id)}
export {handler as PATCH,handler as DELETE};
