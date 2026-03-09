export const LoadingPanel = ({
  subtitle,
  title,
}: {
  subtitle: string;
  title: string;
}) => (
  <div className="panel flex min-h-64 flex-col justify-center gap-3 p-8">
    <span className="data-label">Loading</span>
    <h2 className="text-2xl font-semibold text-steel-900">{title}</h2>
    <p className="max-w-xl text-sm text-steel-600">{subtitle}</p>
  </div>
);
