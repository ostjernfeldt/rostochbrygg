interface PaymentMethodStat {
  method: string;
  count: number;
  percentage: string;
  amount: number; // Added amount field
}

export const PaymentMethodStats = ({ stats }: { stats: PaymentMethodStat[] }) => {
  const formatMethod = (method: string) => {
    switch (method) {
      case "IZETTLE_CARD":
        return "KORT";
      case "IZETTLE_CASH":
        return "KONTANT";
      default:
        return method;
    }
  };

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-bold">Betalningsmetoder</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ method, count, percentage, amount }) => (
          <div key={method} className="stat-card">
            <h3 className="text-gray-400">{formatMethod(method)}</h3>
            <div className="mt-2">
              <div className="text-2xl font-bold">{percentage}%</div>
              <div className="text-sm text-gray-400">
                {count} transaktioner
                <br />
                SEK {Math.round(amount).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};