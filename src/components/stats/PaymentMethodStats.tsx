interface PaymentMethodStat {
  method: string;
  count: number;
  percentage: string;
}

export const PaymentMethodStats = ({ stats }: { stats: PaymentMethodStat[] }) => {
  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-bold">Betalningsmetoder</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ method, count, percentage }) => (
          <div key={method} className="stat-card">
            <h3 className="text-gray-400">{method}</h3>
            <div className="mt-2">
              <div className="text-2xl font-bold">{percentage}%</div>
              <div className="text-sm text-gray-400">{count} transaktioner</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};