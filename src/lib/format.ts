/** Short Arabic relative time: "الآن"، "قبل 5 د"، "قبل 3 س"، "قبل يومين". */
export function ago(iso: string | null | undefined): string {
  if (!iso) return '';
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (min < 1) return 'الآن';
  if (min < 60) return `قبل ${min} د`;
  const h = Math.round(min / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.round(h / 24);
  return d === 1 ? 'أمس' : d === 2 ? 'قبل يومين' : `قبل ${d} أيام`;
}

/** Age of something waiting, e.g. "منذ 30 ساعة". */
export function waitingFor(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (min < 60) return `${min} دقيقة`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} ساعة`;
  return `${Math.round(h / 24)} يوم`;
}

export function dueLabel(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.round((Date.parse(iso) - Date.now()) / 86_400_000);
  if (days < 0) return `متأخرة ${-days === 1 ? 'يومًا' : `${-days} أيام`}`;
  if (days === 0) return 'اليوم';
  if (days === 1) return 'غدًا';
  return `بعد ${days} أيام`;
}
