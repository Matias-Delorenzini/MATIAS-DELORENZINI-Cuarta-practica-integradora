import { Command } from "commander";

const program = new Command();

program
    .option("-d, --debug", "Variable para debug", false)
    .option("-p, --port <port>", "puerto del servidor", "8080")
    .option("--mode <mode>", "Modo de trabajo", "production")
    .requiredOption("-u, --user <user>", "Usuario utilizando el aplicativo", "No se ha declarado un usuario")
    .option("-l, --letters [letters...]", "specify letters");

program.parse(process.argv);

console.log("Options:", program.opts());
console.log("Remaining arguments:", program.args);