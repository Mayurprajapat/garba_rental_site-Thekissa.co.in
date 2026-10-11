// Review form validation — pure (zero imports, testable).

/** Returns error message, or '' when valid. English only. */
export function validReview(name: string, rating: number, text: string): string {
  if (String(name || '').trim().length < 2) return 'Please enter your name.';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return 'Please tap a star rating (1–5).';
  if (String(text || '').trim().length < 4) return 'Please write a few words about the outfit.';
  if (String(text || '').length > 500) return 'Please keep your review under 500 characters.';
  return '';
}
