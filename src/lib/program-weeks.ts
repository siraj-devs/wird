type ProgramWeekWithDate = {
  week_id: string;
  week: { start_date: string };
};

export const sortProgramWeeksByStartDate = <T extends ProgramWeekWithDate>(
  weeks: T[],
): T[] => {
  return [...weeks].sort((a, b) =>
    a.week.start_date.localeCompare(b.week.start_date),
  );
};

export const getWeekOrderByStartDate = (
  weeks: ProgramWeekWithDate[],
  weekId: string,
): number | null => {
  const sorted = sortProgramWeeksByStartDate(weeks);
  const index = sorted.findIndex((week) => week.week_id === weekId);
  return index >= 0 ? index + 1 : null;
};
