import exists from './exists.js'

const getValOrDefault = (val: any, defaultVal: any): any => exists(val) ? val : defaultVal

export default getValOrDefault
