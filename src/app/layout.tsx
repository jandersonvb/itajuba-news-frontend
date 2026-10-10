import type {Metadata} from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL(process.env.SITE_URL||'http://localhost:3000'),title:{default:'Itajubá News • A cidade acontece aqui',template:'%s | Itajubá News'},description:'Notícias de Itajubá e do Sul de Minas. Informação que conecta você.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Header/>{children}<Footer/></body></html>}
