export const EmptyPanel = ({
  description,
  title,
}: {
  description: string;
  title: string;
}) => (
  <section className="grid gap-3 rounded-[28px] border border-dashed border-steel-200 bg-steel-50/60 p-6">
    <span className="data-label">No active content</span>
    <h3 className="text-2xl font-semibold text-steel-900">{title}</h3>
    <p className="max-w-2xl text-sm leading-6 text-steel-600">
      {description}
    </p>
  </section>
);
