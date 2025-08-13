import { Code2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex-shrink-0 border-b border-border px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <Code2 className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold font-headline text-foreground">
          CodeSight AI
        </h1>
      </div>
    </header>
  );
}
