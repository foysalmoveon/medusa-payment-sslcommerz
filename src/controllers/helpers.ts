export const generateTransactionId =()=> {
    const prefix = "TX";
    const randomSuffix = Math.floor(Math.random() * 1000000); 
    const timestamp = Date.now();
    return `${prefix}${timestamp}${randomSuffix}`;
};
