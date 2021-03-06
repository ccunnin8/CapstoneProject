import QueryFilter from "./queryFilter";
import Order from "./queryOrder";
import SOP from "./querySOP";
import MOP from "./queryMOP";
import Aggregator from "./Aggregation";

export interface IsplitQuery {
    dataset: string;
    filter: QueryFilter | QueryFilter[];
    order: Order;
    show: string[];
    grouped?: boolean;
    groupedBy?: string[];
    aggregators?: Aggregator[];
}

export class SplitQuery {
    protected regex: string = '(?= and (?:(?:[^"]*"){2})*[^"]*$| or (?:(?:[^"]*"){2})*[^"]*$)';
    protected POS_LOOK_AHEAD_AND: RegExp = new RegExp(this.regex, "g");
    protected COMMA: RegExp = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
    protected SEMI: RegExp = /;(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
    protected SPLIT_QUERY: IsplitQuery;

    constructor(query: string) {
        query = query.replace(/Full Name(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g, "FullName");
        query = query.replace(/Short Name(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g, "ShortName");
        this.split_query(query);
    }
    // Returns an object with dataset, filter, show, order (IsplitQuery interface)
    // This method could use some prettying up
    public split_query(query: string): void {
        let sepBySemi: string[];
        let sepByComa: string[];
        sepBySemi = query.split(this.SEMI);
        if (sepBySemi.length < 2) { throw new Error("Incorrectly formatted query"); }
        sepByComa = sepBySemi[0].split(this.COMMA);
        if (sepByComa.length < 2) { throw new Error("Incorrectly formatted query"); }

        const dataset: string = sepByComa[0].trim();
        const filter: QueryFilter | QueryFilter[] = this.split_filter(sepByComa[1].slice(1).trim());
        const show: string[] = this.split_show(sepBySemi[1].trim());
        let order: Order = null;
        if (sepBySemi.length === 3) {
            order = new Order(sepBySemi[2].trim().slice(0, -1), show);
        }
        this.SPLIT_QUERY = { dataset, filter, show, order, grouped: false };
    }

    public get_split_query(): IsplitQuery {
        return this.SPLIT_QUERY;
    }

    // returns the input (id of the dataset)
    public get_input(): string {
        if (this.SPLIT_QUERY.dataset) {
            return this.SPLIT_QUERY.dataset.split(" ")[3];
        } else {
            throw new Error("dataset undefined");
        }
    }

    // returns array of keys used in filters
    public get_filter_keys(): string[] {
        const keys: string[] = [];
        for (const filter of this.get_split_query().filter as QueryFilter[]) {
            const key: string = filter.criteria.getKey();
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    public toString(): string {
        return `\n\tdataset: ${this.get_split_query().dataset}
        \nfilter: ${this.get_split_query().filter.toString()}
        \norder: ${this.get_split_query().order}
        \nshow: ${this.get_split_query().show}`;
    }
    /**
     * @param filter "is \"the and that\" and is not equal to 75 or is less than 400"
     * @returns QueryFilters built with ["is \"the and \that", "and is not equal to 75", "or is less than 400"]]
     *
     */
    protected split_filter(filter: string): QueryFilter | QueryFilter[] {
        if (filter === "find all entries") {
            return new QueryFilter(true);
        } else {
            const criteria: string = filter.split("find entries whose")[1];
            let splitByAndOr: string[];
            // splits into list of individual CRITERIA
            splitByAndOr = criteria.split(this.POS_LOOK_AHEAD_AND);
            return this.parse_criteria(splitByAndOr);
        }
    }

    /**
     *
     * @param show "show Department and Title and Audit"
     * @returns ["Department","Title","Audit"]
     *
     */
    protected split_show(show: string): string[] {
        // trim show just in case
        show = show.trim();
        // if show has a period at the end remove the period
        if (show.slice(-1) === ".") {
            show = show.slice(0, -1);
        }
        // commas ?
        show = show.replace(/,/g, "");
        // split show into words and filter out words that are not keys
        return show.split(" ").filter((x) => x !== "show").filter((x) => x !== "and");
    }

    // returns an array of criteria, maybe criteria should be objects

    private parse_criteria(criteria: string[]): QueryFilter[] {
        const filterList: QueryFilter[] = [];
        for (const c of criteria) {
            // chop string into words but keep strings in quotes together
            const words: string[] = c.trim().split(/\s(?=(?:[^"']|["|'][^"']*")*$)/);
            let andOr: string = null;
            let key: string;
            let OP: SOP | MOP;
            const target: string = words.pop();
            if (words[0] === "and" || words[0] === "or") {
                andOr = words.shift();
                key = words.shift();
            } else {
                key = words.shift();
            }
            // target is a string
            if (isNaN(parseFloat(target))) {
                OP = new SOP(key, words.join(" "), target);
                // target is a number
            } else {
                OP = new MOP(key, words.slice(1).join(" "), parseFloat(target));
            }
            filterList.push(new QueryFilter(false, andOr, OP));
        }
        return filterList;
    }

}
