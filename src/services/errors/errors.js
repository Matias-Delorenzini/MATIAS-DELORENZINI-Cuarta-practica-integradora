import { errorDictionary } from "./info.js";

class CustomError extends Error {
    constructor(code, status) {
        super(errorDictionary[code]);
        this.code = code;
        this.status = status || 400
    }
}

export { CustomError };