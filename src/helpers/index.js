const path = require('path');
const fs = require('fs');

const envInit = () => {
    let obj = {}
    const pathToEnv = path.join(process.cwd(), './.env');
    const envVariables = fs.readFileSync(pathToEnv, {encoding:'utf8'});
    envVariables.split('\n').filter(st => st.length > 0).forEach(st => {
        const [key, value] = st.split('=');
        process.env[key] = value;
        obj[key] = value;
    });
}

module.exports = envInit;