import Logo from './Logo';

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-black">
      <Logo className="h-24 w-24 mb-4" />
      <h1 className="text-4xl font-bold mb-2">Budditor</h1>
      <p className="text-lg text-gray-600 mb-8">Your AI Code editor buddy</p>
      <div className="windows-loading">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <style jsx>{`
        .windows-loading {
          display: flex;
          gap: 6px;
        }
        .windows-loading > div {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #333;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .windows-loading div:nth-child(1) {
          animation-delay: -0.32s;
        }
        .windows-loading div:nth-child(2) {
          animation-delay: -0.16s;
        }
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1.0);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
