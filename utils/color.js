const colors = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",

    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    gray: "\x1b[90m",
    cyan: "\x1b[36m",
};

export const color = {
    apply(text, colorCode) {
        return `${colorCode}${text}${colors.reset}`;
    },

    blue: (t) => color.apply(t, colors.blue),
    green: (t) => color.apply(t, colors.green),
    yellow: (t) => color.apply(t, colors.yellow),
    red: (t) => color.apply(t, colors.red),
    gray: (t) => color.apply(t, colors.gray),
    cyan: (t) => color.apply(t, colors.cyan),

    bold: (t) => color.apply(t, colors.bold),
};
