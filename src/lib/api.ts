export type Category={id:string;name:string;slug:string};
export type Article={id:string;title:string;slug:string;excerpt:string;content:string;categoryId:string;imageUrl:string;author:string;publishedAt:string|null;status:'draft'|'published';featured:boolean;demo:boolean};
export type Sponsor={id:string;name:string;logoUrl:string;websiteUrl:string;active:boolean};
export type Campaign={id:string;name:string;sponsorId:string;slot:'leaderboard'|'sidebar';imageUrl:string;targetUrl:string;startsAt:string;endsAt:string;active:boolean;sponsor?:Sponsor};
export const apiUrl=()=>process.env.API_URL||'http://localhost:4000/api';
export async function api<T>(path:string):Promise<T>{const res=await fetch(apiUrl()+path,{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!res.ok)throw new Error('API respondeu '+res.status);return res.json() as Promise<T>;}
export const dateLabel=(d:string|null)=>d?new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeZone:'America/Sao_Paulo'}).format(new Date(d)):'';
