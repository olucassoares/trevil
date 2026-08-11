"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="fatal-error"><span><AlertTriangle size={25}/></span><h1>A operação encontrou um problema</h1><p>Seus dados permanecem seguros. Tente carregar esta área novamente.</p><button onClick={reset}><RotateCcw size={15}/> Tentar novamente</button></main>;
}
