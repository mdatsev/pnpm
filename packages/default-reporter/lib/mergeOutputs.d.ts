import most = require('most');
export default function mergeOutputs(outputs: Array<most.Stream<most.Stream<{
    msg: string;
}>>>): most.Stream<string>;
