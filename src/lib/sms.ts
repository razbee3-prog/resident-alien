/** iMessage deep links. The `?&body=` form opens Messages with the text drafted on iPhone, iPad, Mac, and Android. */
export function smsDraftHref(number: string, body: string): string {
  return `sms:${number}?&body=${encodeURIComponent(body)}`;
}

/** Drafted when the user taps "I'm logged in" on the connect page; sending it is what makes the coach read the score. */
export const LOGGED_IN_DRAFT = "I’m logged in 👽 read my score";
