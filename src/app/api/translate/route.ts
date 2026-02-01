import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, targetLang = 'es' } = await req.json();

    if (!text) return NextResponse.json({ text: '' });

    // Usamos un endpoint de traducción gratuito (Google Translate RPC)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Google devuelve un array anidado con las partes traducidas
    const translatedText = data[0].map((item: any) => item[0]).join('');

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation Error:', error);
    return NextResponse.json({ error: 'Error al traducir' }, { status: 500 });
  }
}