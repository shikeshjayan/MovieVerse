const Skeleton = ({ 
  className = "", 
  variant = "text",
  width,
  height,
  rounded = "rounded",
  ...props 
}) => {
  const baseClasses = "animate-pulse bg-gray-300 dark:bg-gray-600";
  
  const variants = {
    text: "h-4 w-full",
    title: "h-6 w-3/4",
    avatar: "w-24 h-24 rounded-full",
    card: "h-48 w-full",
    thumbnail: "w-48 h-67.5",
    button: "h-10 w-24",
    input: "h-12 w-full",
  };

  const style = {
    width: width || (variants[variant] ? undefined : '100%'),
    height: height || (variants[variant] ? undefined : '1rem'),
  };

  return (
    <div
      className={`${baseClasses} ${rounded} ${variants[variant] || ''} ${className}`}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
};

const SkeletonGroup = ({ children, loading }) => {
  if (!loading) return children;
  
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="card" className="w-48" />
      ))}
    </div>
  );
};

export { Skeleton, SkeletonGroup };
export default Skeleton;
