import { Code2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex-shrink-0 border-b border-gray-300 px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <Code2 className="h-7 w-7 text-black" />
        <h1 className="text-xl font-bold text-black">
          CodeSight AI
        </h1>
      </div>
    </header>
  );
}
