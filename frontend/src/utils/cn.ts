type ClassValue = string | false | null | undefined;

export const cn = (...classes: ClassValue[]) => {
  return classes.filter(Boolean).join(' ');
};
