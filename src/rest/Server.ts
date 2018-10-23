/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import {InsightResponse} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";
import { inspect, promisify } from "util";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");
                const insightFacade: InsightFacade = new InsightFacade();
                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser());
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });
                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                that.rest.get("/echo/:msg", Server.echo);

                // NOTE: your endpoints should go here
                that.rest.put("/dataset/:id/:kind", async (req, res, next) => {
                    const { id, kind } = req.params;
                    let response: InsightResponse;
                    let code: number;
                    try {
                        const buffer: Buffer = await (promisify)(fs.readFile)(req.files.body.path);
                        const content: string = buffer.toString("base64");
                        response = await insightFacade.addDataset(id, content, kind);
                        code = 204;
                    } catch (err) {
                        Log.info("Error occurred " + inspect(err));
                        response = err;
                        code = 400;
                    }
                    res.json(code, response);
                    return next();
                });

                that.rest.del("/dataset/:id", async (req, res, next) => {
                    const id: string = req.params.id;
                    let response: InsightResponse;
                    let code: number;
                    try {
                        response = await insightFacade.removeDataset(id);
                        code = 204;
                    } catch (err) {
                        response = err;
                        code = 404;
                    }
                    res.json(code, response);
                    return next();
                });

                that.rest.post("/query", async (req, res, next) => {
                    let response: InsightResponse;
                    let code: number;
                    try {
                        // work around to get tests to pass for front end
                        const query: string = JSON.parse(req.body).query;
                        response = await insightFacade.performQuery(query);
                        code = 200;
                    } catch (err) {
                        response = err;
                        code = 400;
                    }
                    res.json(code, response);
                    return next();
                });

                that.rest.get("/datasets", async (req, res, next) => {
                    let code: number;
                    let response: InsightResponse;
                    Log.info("GET DATASETS");
                    try {
                        response = await insightFacade.listDatasets();
                        code = 200;
                    } catch (err) {
                        response = err;
                        code = 400;
                    }
                    res.json(code, response);
                    return next();
                });

                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const result = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + result.code);
            res.json(result.code, result.body);
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err.message});
        }
        return next();
    }

    private static performEcho(msg: string): InsightResponse {
        if (typeof msg !== "undefined" && msg !== null) {
            return {code: 200, body: {result: msg + "..." + msg}};
        } else {
            return {code: 400, body: {error: "Message not provided"}};
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

}
