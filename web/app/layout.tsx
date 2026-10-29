import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import '../src/style.css';
export const metadata:Metadata={title:'Putzonaut · Deine Crew. Eure Mission.',description:'Haushaltsmissionen erledigen, Sterne sammeln und als Familie, Paar oder WG mehr schaffen.',manifest:'/manifest.webmanifest',icons:{icon:'/icons/icon.svg',apple:'/icons/apple-touch-icon.png'},robots:{index:false,follow:false},referrer:'no-referrer'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#080e2f'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="de"><body>{children}</body></html>;}
