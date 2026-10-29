'use client';
import { useEffect, useState } from 'react';
import App from '../src/App';
export default function Putzonaut(){const [mounted,setMounted]=useState(false);useEffect(()=>setMounted(true),[]);return mounted?<App/>:<main className="loading"><h1>Putzonaut</h1><p>Deine Basis wird vorbereitet …</p></main>;}
