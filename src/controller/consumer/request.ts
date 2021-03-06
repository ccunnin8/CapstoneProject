import * as http from "http";

export interface IGeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export default class Request {

    public async getCoords(address: string): Promise<{}> {
        const options = {
            host: "sdmm.cs.ubc.ca",
            port: 11316,
            method: "GET",
            path: "/api/v1/team_ccunnin8/" + encodeURI(address),
        };
        return new Promise((resolve, reject) => {
            try {
                http.get(options, (res) => {
                    const { statusCode } = res;
                    const contentType = res.headers["content-type"];
                    let error;
                    if (statusCode !== 200) {
                        error = new Error("Request Failed. Status Code: ${statusCode}");
                    } else if (!/^application\/json/.test(contentType)) {
                        error = new Error("Invalid content-type." +
                            " Expected application / json but received ${ contentType }");
                    }
                    if (error) {
                        res.resume();
                        resolve({
                            lat: 0,
                            lon: 0,
                        });
                    }
                    res.setEncoding("utf8");
                    let rawData: string = "";
                    res.on("data", (chunk) => { rawData += chunk; });
                    res.on("end", () => {
                        try {
                            const parsedData = JSON.parse(rawData);
                            resolve(parsedData);
                        } catch (err) {
                            resolve({ lat: 0, lon: 0 });
                        }
                    });
                    res.on("error", (err) => {
                        resolve({ lat: 0, lon: 0 });
                    });
                });
            } catch (err) {
                resolve({ lat: 0, lon: 0 });
            }
        });
    }
}
