const colors = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    red:    '\x1b[31m',
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    blue:   '\x1b[34m',
    gray:   '\x1b[90m',
    cyan:   '\x1b[36m',
};

const gradientColors = [
    colors.cyan,
    colors.blue,
    colors.green,
    colors.yellow,
    colors.red,
    colors.gray,
];

export const color = {
    apply(text: string, colorCode: string) {
        return `${colorCode}${text}${colors.reset}`;
    },

    blue:     (t: string) => color.apply(t, colors.blue),
    green:    (t: string) => color.apply(t, colors.green),
    yellow:   (t: string) => color.apply(t, colors.yellow),
    red:      (t: string) => color.apply(t, colors.red),
    gray:     (t: string) => color.apply(t, colors.gray),
    cyan:     (t: string) => color.apply(t, colors.cyan),

    bold:     (t: string) => color.apply(t, colors.bold),
    gradient: (parts: string[]) => parts
            .map((part, index) =>
                `${gradientColors[index % gradientColors.length]}${part}${colors.reset}`
            )
            .join(''),
};
