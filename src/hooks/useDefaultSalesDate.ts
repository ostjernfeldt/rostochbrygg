import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const useDefaultSalesDate = (salesDates: string[] | undefined) => {
  const [defaultDate, setDefaultDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (salesDates && salesDates.length > 0) {
      const latestDate = salesDates[0];
      setDefaultDate(latestDate);
    }
  }, [salesDates]);

  return defaultDate;
};