
export default class Order {
    private keys: string[];
    private order: string;
    private direction: string;
    private validKeys: string[];

    constructor(order: string, show: string[]) {
        this.order = order.trim();
        this.validKeys = show;
        this.parse(order);
    }

    public getKeys(): string[] { return this.keys; }

    public getDirection(): string { return this.direction; }

    public validateOrder(): boolean {
        return this.validateKeys(this.keys)
            && (/^sort in ascending order by/.test(this.order) || /^sort in descending order by/.test(this.order));
    }

    public toString(): string {
        return `\n\tkey: ${this.keys}, order: ${this.direction}
        \n\t valid keys? ${this.validateKeys(this.keys)}
        \n\t valid length? ${this.order.split(" ").length === 6}
        \n\t valid phrasing? ${(/^sort in ascending order by/.test(this.order)
            || /^sort in descending order by/.test(this.order))};`;
    }

    private parse(order: string) {
        // this no longer works with grouped queries
        const words: string[] = order.split(" order by ");
        const keysPhrase: string = words[1];
        const keys: string[] = keysPhrase.replace(/,/g, " and").split(" and ");
        this.keys = keys;

        if (order.includes("ascending")) {
            this.direction = "up";
        } else {
            this.direction = "down";
        }
    }

    private validateKeys(keys: string[]): boolean {
        for (const key of keys) {
            if (!this.validKeys.includes(key)) {
                return false;
            }
        }
        return true;
    }

}
