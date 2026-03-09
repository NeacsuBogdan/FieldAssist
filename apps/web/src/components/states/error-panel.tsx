import { Button } from "@/components/ui/button";

export const ErrorPanel = ({
  description,
  onRetry,
  title,
}: {
  description: string;
  onRetry?: () => void;
  title: string;
}) => (
  <div className="panel flex min-h-64 flex-col justify-center gap-4 p-8">
    <span className="data-label text-rose-500">Attention</span>
    <h2 className="text-2xl font-semibold text-steel-900">{title}</h2>
    <p className="max-w-xl text-sm text-steel-600">{description}</p>
    {onRetry ? (
      <Button className="w-fit" onClick={onRetry} variant="secondary">
        Try again
      </Button>
    ) : null}
  </div>
);
