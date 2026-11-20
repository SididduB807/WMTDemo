export interface Rational { numerator: number; denominator: number }
export function rational(numerator: number, denominator = 1): Rational {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) throw new Error('Expected safe integer inputs and a positive denominator.');
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const divisor = gcd(Math.abs(numerator), denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}
export const subtract = (a: Rational, b: Rational) => rational(a.numerator * b.denominator - b.numerator * a.denominator, a.denominator * b.denominator);
export const multiply = (a: Rational, b: Rational) => rational(a.numerator * b.numerator, a.denominator * b.denominator);
export const divide = (a: Rational, b: Rational) => rational(a.numerator * b.denominator, a.denominator * b.numerator);
export const valueOf = (a: Rational) => a.numerator / a.denominator;
export const equal = (a: Rational, b: Rational) => a.numerator * b.denominator === b.numerator * a.denominator;
