import { expect } from "chai";
import Validator from "../src/controller/consumer/validator";
import Parser from "../src/controller/consumer/parser";
import * as fs from "fs";

describe("Consumer valid_file validator", () => {
    let validator: Validator;

    it("Should return false if the file is not a zip", async () => {
        const filename: string = "./test/data/testfile.jpg";
        const foldername: string = "testfile";
        validator = new Validator(filename, foldername);
        let value: boolean;
        try {
            value = await validator.valid_file();
        } catch (err) {
            value = err;
        } finally {
            expect(value).to.equal(false);
        }
    });

    it("Should return false if the file does not contain csv", async () => {
        const filename: string = "./test/data/nonsense.zip";
        const foldername: string = "nonsense";
        validator = new Validator(filename, foldername);
        let value: boolean;
        try {
            value = await validator.valid_file();
        } catch (err) {
            value = err;
        } finally {
            expect(value).to.equal(false);
        }
    });

    it("Should return true if the file is a valid zip file that contains csv", async () => {
        const filename: string = "./test/data/courses.zip";
        const foldername: string = "courses";
        validator = new Validator(filename, foldername);
        let value: boolean;
        try {
            value = await validator.valid_file();
        } catch (err) {
            value = err;
        } finally {
            expect(value).to.equal(true);
        }
    });

});

describe("Consumer Parser", () => {

    let parser: Parser;
    const filename: string = "./test/data/small_test.zip";
    const id: string = "small_test";
    before("Before each", () => {
        // assumes that file is valid
        parser = new Parser(id, filename);
    });

    after("After each", () => {
        // TODO: delete file made for cache
    });

    it("Should parse each line of a file and convert it into an object", async () => {
        const expected: object[] = [
            {
                 small_test_title: "gross anat limbs",
                 small_test_id: "1845",
                 small_test_professor: "alimohammadi, majid",
                 small_test_audit: 0,
                 small_test_year: "2013",
                 small_test_course: 392,
                 small_test_pass: 82,
                 small_test_fail: 0,
                 small_test_avg: 81.82,
                 small_test_subject: "anat",
                 small_test_section: "001",
            },
            {
                small_test_title: "gross anat limbs",
                small_test_id: "1846",
                small_test_professor: "",
                small_test_audit: 0,
                small_test_year: "2013",
                small_test_course: 392,
                small_test_pass: 82,
                small_test_fail: 0,
                small_test_avg: 81.82,
                small_test_subject: "anat",
                small_test_section: "overall",
            },
            {
                small_test_title: "gross anat limbs",
                small_test_id: "12690",
                small_test_professor: "alimohammadi, majid",
                small_test_audit: 0,
                small_test_year: "2014",
                small_test_course: 392,
                small_test_pass: 83,
                small_test_fail: 0,
                small_test_avg: 83.65,
                small_test_subject: "anat",
                small_test_section: "001",
            },
        ];
        const actual: object[] = await parser.parse_data();
        expect(actual).to.deep.equal(expected);
    });

    it("Should store the objects in a cache", async () => {
        const data: object[] = await parser.parse_data();
        await parser.store_data(data);
        expect(fs.existsSync("./src/cache/" + id + ".json")).to.equal(true);
    });

});
