import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const target=new URL('../.env.local',import.meta.url);
if(!existsSync(target)){let text=readFileSync(new URL('../.env.example',import.meta.url),'utf8');writeFileSync(target,text,{mode:0o600});console.log('Configuração local criada.');}else console.log('Configuração existente preservada.');
