export default function Footer() {
  return (
    <footer className="w-full bg-white/50 backdrop-blur-sm border-t border-slate-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} <span className="font-semibold text-slate-600">Matchire AI</span>. All rights reserved.
        </p>
        <div className="flex gap-4 mt-2 md:mt-0">
          <span className="hover:text-indigo-500 cursor-pointer transition">Privacy Policy</span>
          <span className="hover:text-indigo-500 cursor-pointer transition">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};