export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="relative">
        {/* Dış halka */}
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100"></div>
        {/* Dönen iç halka */}
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
};