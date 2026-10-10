import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {api,apiUrl,Category} from '@/lib/api';
import Dashboard from '@/components/Dashboard';
export const metadata={title:'Painel editorial',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Admin(){const token=(await cookies()).get('itajuba-session')?.value;if(!token)redirect('/admin/login');let valid:Response;try{valid=await fetch(apiUrl()+'/admin/articles',{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(8000)})}catch{return <main className="wrap article-page"><h1>API indisponível.</h1><p>Confira o backend e tente novamente.</p></main>;}if(valid.status===401)redirect('/admin/login');if(!valid.ok)throw new Error('Painel indisponível');const categories=await api<Category[]>('/categories');return <Dashboard categories={categories}/>}
