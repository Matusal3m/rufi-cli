export class Format {
    private static formatToFlat = (template: string) => {
        return template
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .join('\n');
    };

    private static formatWithIndent = (template: string) => {
        const lines = template.split('\n');

        const baseIndent = this.getIndentReduceLength(lines);

        return lines
            .map((line, index) => {
                if (!line.trim() && index === 0) return;
                if (!line.trim() && !lines[index - 1].trim()) return;
                if (!line.trim()) return '';

                return line.substring(baseIndent);
            })
            .filter(line => line === '' || !!line)
            .join('\n');
    };

    private static getIndentReduceLength = (lines: string[]) => {
        // @ts-ignore
        const indentsLength = lines.map(line => {
            const matchs = line.match(/(^ *)/);

            if (!matchs) return 0;

            const spaces = matchs[0];

            if (spaces === undefined) return 0;

            return spaces.length;
        });

        if (indentsLength.every(indent => indent === 0)) return 0;

        return Math.min(...indentsLength.filter(Boolean));
    };

    public static template = {
        flat: this.formatToFlat,
        withIndent: this.formatWithIndent,
    };
}
