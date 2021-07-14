//generate a random code by digit
export const generateCode = (digit) => {
  const start = digit <= 1? 1: Math.pow(10, digit-1);
  return Math.floor(start + Math.random() * 9 * start);
}