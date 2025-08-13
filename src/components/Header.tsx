import Logo from './Logo';

export default function Header() {
  return (
    <header className="flex-shrink-0 border-b border-gray-300 px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-black" />
        <div>
          <h1 className="text-xl font-bold text-black">
            Budditor
          </h1>
          <p className="text-xs text-gray-500">Your AI Code editor buddy</p>
        </div>
      </div>
    </header>
  );
}
