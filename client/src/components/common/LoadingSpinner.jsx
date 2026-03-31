export default function LoadingSpinner({ fullScreen = false, size = "md" }) {
  const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };

  const spinner = (
    <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-primary ${sizes[size]}`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-sm text-gray-500">Loading eVoteFace...</p>
        </div>
      </div>
    );
  }

  return <div className="flex justify-center py-8">{spinner}</div>;
}
