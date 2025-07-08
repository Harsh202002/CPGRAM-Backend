const {v4: uuidv4} = require('uuid');

const generateUniqueID = () =>{
    return `GRV-${uuidv4().split('-')[0].toUpperCase()}`;
};
module.exports = generateUniqueID;