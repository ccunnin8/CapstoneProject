import { expect } from "chai";
import ValidateQuery from "../src/controller/queryAST/validateQuery";
import { SplitQuery } from "../src/controller/queryAST/splitQuery";
import QueryFilter from "../src/controller/queryAST/queryFilter";
import MOP from "../src/controller/queryAST/queryMOP";
import SOP from "../src/controller/queryAST/querySOP";
import Order from "../src/controller/queryAST/queryOrder";

describe("Query splitter", () => {
    const splitQuery = new SplitQuery("In rooms dataset rooms, find entries whose Average is greater" +
                                    " than 90 and Department is \"adhe\" " +
                                    "or Average is equal to 95; show Department and ID and Average;" +
                                    " sort in ascending order by Average.");
    const IsplitQuery = splitQuery.get_split_query();

    it("Should have proper dataset", () => {
        const expected: string = "In rooms dataset rooms";
        expect(IsplitQuery.dataset).to.equal(expected);
    });

    it("Should have proper filter", () => {
        const q1: QueryFilter = new QueryFilter(false, null, new MOP("Average", "greater than", 90));
        const q2: QueryFilter = new QueryFilter(false, "and", new SOP("Department", "is", "\"adhe\""));
        const q3: QueryFilter = new QueryFilter(false, "or", new MOP("Average", "equal to", 95));
        const filters: QueryFilter[] = IsplitQuery.filter as QueryFilter[];
        // these should deeply equal each other, there's no field that's different so i made them strings
        // but that really wasn't testing anything so...
        expect(filters[0].criteria.getOP()).to.equal(q1.criteria.getOP());
        expect(filters[1].criteria.getOP()).to.equal(q2.criteria.getOP());
        expect(filters[2].criteria.getOP()).to.equal(q3.criteria.getOP());
        expect(filters[0].criteria.getTarget()).to.equal(q1.criteria.getTarget());
        expect(filters[1].criteria.getTarget()).to.equal(q2.criteria.getTarget());
        expect(filters[2].criteria.getTarget()).to.equal(q3.criteria.getTarget());
        expect(filters[0].criteria.getKey()).to.equal(q1.criteria.getKey());
        expect(filters[1].criteria.getKey()).to.equal(q2.criteria.getKey());
        expect(filters[2].criteria.getKey()).to.equal(q3.criteria.getKey());
    });

    it("Should have proper order", () => {
        const expected: Order = new Order("sort in ascending order by Average");
        expect(IsplitQuery.order).to.deep.equal(expected);
    });

    it("Should have proper show", () => {
        const expected: string[] = ["Department", "ID", "Average"];
        expect(IsplitQuery.show).to.deep.equal(expected);
    });

    it("Should split filter with more than two words in string", () => {
        const split = new SplitQuery("In rooms dataset rooms, find entries whose Average is not greater" +
            " than 90 and Department is \"fuck this shit\" " +
            "or Average is not equal to 95; show Department and ID and Average;" +
            " sort in ascending order by Average.");
        const AST = split.get_split_query();
        const filters: QueryFilter[] = AST.filter as QueryFilter[];
        const q1: QueryFilter = new QueryFilter(false, null, new MOP("Average", "not greater than", 90));
        const q2: QueryFilter = new QueryFilter(false, "and", new SOP("Department", "is", '"fuck this shit"'));
        const q3: QueryFilter = new QueryFilter(false, "or", new MOP("Average", "not equal to", 95));
        expect(filters[0].criteria.getOP()).to.equal(q1.criteria.getOP());
        expect(filters[1].criteria.getOP()).to.equal(q2.criteria.getOP());
        expect(filters[2].criteria.getOP()).to.equal(q3.criteria.getOP());
        expect(filters[0].criteria.getTarget()).to.equal(q1.criteria.getTarget());
        expect(filters[1].criteria.getTarget()).to.equal(q2.criteria.getTarget());
        expect(filters[2].criteria.getTarget()).to.equal(q3.criteria.getTarget());
        expect(filters[0].criteria.getKey()).to.equal(q1.criteria.getKey());
        expect(filters[1].criteria.getKey()).to.equal(q2.criteria.getKey());
        expect(filters[2].criteria.getKey()).to.equal(q3.criteria.getKey());
    });

});
describe("QueryOP", () => {

    it("Should return false if invalid M_OP KEY", () => {
        const expected: boolean = false;
        const mop: MOP = new MOP("Department", "is greater than", 45);
        const actual: boolean = mop.validateCriteria();
        expect(expected).to.equal(actual);
    });

    it("Should return true if invalid M_OP OP", () => {
        const expected: boolean = false;
        const mop: MOP = new MOP("Audt", "includes", 45);
        const actual: boolean = mop.validateCriteria();
        expect(expected).to.equal(actual);
    });

    it("Should return true if valid M_OP OP", () => {
        const expected: boolean = true;
        const mop: MOP = new MOP("Audit", "greater than", 45);
        const actual: boolean = mop.validateCriteria();
        expect(expected).to.equal(actual);
    });

    it("Should return false if ivalid S_OP key", () => {
        const expected: boolean = false;
        const sop: SOP = new SOP("Average", "starts with", "g");
        const actual: boolean = sop.validateCriteria();
        expect(expected).to.equal(actual);
    });

    it("Should return false if invalid S_OP OP", () => {
        const expected: boolean = false;
        const sop: SOP = new SOP("Title", "is greater than", "g");
        const actual: boolean = sop.validateCriteria();
        expect(expected).to.equal(actual);
    });

    it("Should return true if valid S_OP", () => {
        const expected: boolean = true;
        const sop: SOP = new SOP("Title", "is", "Harry Potter");
        const actual: boolean = sop.validateCriteria();
        expect(expected).to.equal(actual);
    });
});

describe("Order", () => {

    it("Should return true with valid order", () => {
        const order: Order = new Order("sort in ascending order by Average");
        const actual: boolean = order.validateOrder();
        const expected: boolean = true;
        expect(actual).to.equal(expected);
    });

    it("Should return false with invalid order", () => {
        const order: Order = new Order("sort in descending order by Average");
        const actual: boolean = order.validateOrder();
        const expected: boolean = false;
        expect(actual).to.equal(expected);
    });

    it("Should return false with invalid order", () => {
        const order: Order = new Order("descending order by Average");
        const actual: boolean = order.validateOrder();
        const expected: boolean = false;
        expect(actual).to.equal(expected);
    });

    it("Should return false with invalid order", () => {
        const order: Order = new Order("sort in descending order by Average Department Title");
        const actual: boolean = order.validateOrder();
        const expected: boolean = false;
        expect(actual).to.equal(expected);
    });

});

describe("Validate Query", () => {
    it("Should validate valid query from q1", () => {
        const expected: boolean = true;
        const query: string = "In courses dataset courses, find entries whose Average is greater than 97;" +
                                "show Department and Average; sort in ascending order by Average.";
        const splitQuery: SplitQuery = new SplitQuery(query);
        const parser: ValidateQuery = new ValidateQuery(splitQuery);
        expect(parser.valid_query(query)).to.equal(expected);
    });

    it("Should validate query from q2", () => {
        const expected: boolean = true;
        const query: string = "In courses dataset courses, find entries whose Average is greater than 90"
        + "and Department is \"adhe\""
        + "or Average is equal to 95; show Department and ID and Average; sort in ascending order by Average.";
        const splitQuery: SplitQuery = new SplitQuery(query);
        const parser: ValidateQuery = new ValidateQuery(splitQuery);
        expect(parser.valid_query(query)).to.equal(true);
    });

    it("Should validate query from q3", () => {
        const expected: boolean = false;
        const query: string = "in rooms dataset abc, find entries whose Seats is greater than 80; show Seats.";
        const splitQuery: SplitQuery = new SplitQuery(query);
        const parser: ValidateQuery = new ValidateQuery(splitQuery);
        expect(parser.valid_query(query)).to.equal(expected);
    });

    it("Should validate query from q4", () => {
        const expected: boolean = false;
        const query: string = "In rooms dataset abc, find entries whose Seats is greater than 80; "
        + "show Seats and Address; sort in ascending order by Average2.";
        const splitQuery: SplitQuery = new SplitQuery(query);
        const parser: ValidateQuery = new ValidateQuery(splitQuery);
        expect(parser.valid_query(query)).to.equal(expected);
    });

    it("Should validate query from q5", () => {
        const expected: boolean = true;
        const query: string = "In courses dataset courses, find entries whose Average is less than 97"
        + " and id is \"400\"; show Department and Average; sort in ascending order by Average.";
        const splitQuery: SplitQuery = new SplitQuery(query);
        const parser: ValidateQuery = new ValidateQuery(splitQuery);
        expect(parser.valid_query(query)).to.equal(expected);
    });

    it("Should validate query with a not MOP", () => {
        const expected: boolean = true;
        const query: string = "In courses dataset courses, find entries whose Average is not greater than 90"
            + "and Department is \"adhe\""
            + "or Average is equal to 95; show Department and ID and Average; sort in ascending order by Average.";
        const splitQuery: SplitQuery = new SplitQuery(query);
        const parser: ValidateQuery = new ValidateQuery(splitQuery);
        expect(parser.valid_query(query)).to.equal(true);
    });

    it("Should validate show; true with valid keys", () => {
        const validKeys: string[] = ["Department", "Title", "Audit"];
        const expected: boolean = true;
        const parser: ValidateQuery = new ValidateQuery(new SplitQuery("In courses dataset courses, " +
            "find all entries; show Department."));
        expect(parser.valid_show(validKeys)).to.equal(expected);
    });

    it("Should validate show; false with invalid keys", () => {
        const invalidKeys: string[] = ["Appaloosa", "Title", "Audit", "Jonathon"];
        const expected: boolean = false;
        const parser: ValidateQuery = new ValidateQuery(new SplitQuery("In courses dataset courses, " +
                                    "find all entries; show Department."));
        expect(parser.valid_show(invalidKeys)).to.equal(expected);
    });

});

describe("Query Filter", () => {
    it("Should validate valid all query", () => {
        const q: QueryFilter = new QueryFilter(true);
        const expected: boolean = true;
        expect(q.validate_filter()).to.equal(true);
    });

    it("Should validate valid query", () => {
        const q: QueryFilter = new QueryFilter(false, "and", new MOP("Audit", "greater than", 45));
        const expected: boolean = true;
        expect(q.validate_filter()).to.equal(expected);
    });

    it("Should return false for invalid query (and or)", () => {
        const q: QueryFilter = new QueryFilter(false, "blue", new MOP("Audit", "greater than", 45));
        const expected: boolean = false;
        expect(q.validate_filter()).to.equal(expected);
    });

    it("Should return false invalid query: invalid MOP or SOP", () => {
        const q: QueryFilter = new QueryFilter(false, "and", new SOP("Purple", "Rain", "Prince"));
        const expected: boolean = false;
        expect(q.validate_filter()).to.equal(expected);
    });
});
