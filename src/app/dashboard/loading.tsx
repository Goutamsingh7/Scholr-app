export default function DashboardLoading() {
  return (
    <div className="p-5 lg:p-8 space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-4 w-28 glass rounded-lg shimmer"/>
        <div className="h-8 w-48 glass rounded-xl shimmer"/>
        <div className="h-3 w-36 glass rounded-lg shimmer"/>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_,i)=><div key={i} className="h-28 glass rounded-2xl shimmer"/>)}
      </div>
      <div className="h-16 glass rounded-2xl shimmer"/>
      <div className="space-y-3">
        <div className="h-5 w-36 glass rounded-xl shimmer"/>
        {[...Array(3)].map((_,i)=><div key={i} className="h-20 glass rounded-2xl shimmer"/>)}
      </div>
    </div>
  );
}
