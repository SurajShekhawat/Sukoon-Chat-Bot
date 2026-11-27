export const Platform = {
  OS: "android",
  select: (obj: any) => obj.android || obj.default,
};

export const Linking = {
  openURL: () => Promise.resolve(),
};

export const StyleSheet = {
  create: (styles: any) => styles,
};

export default {
  Platform,
  Linking,
  StyleSheet,
};

