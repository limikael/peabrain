function declareLMV331(sch, ref) {
    let c=sch.declare(ref, {
        symbol: "Comparator:LMV331",
        footprint: "Package_SO:SOIC-5", // or SOT-23-5 if you prefer compact
        lcsc: "C7950" // LMV331 common LCSC family (adjust if needed)
    });

    return compoundSymbol(c).namePins(["inPlus","gnd","inMinus","out","vcc"]);
}

export function declareCurrentLimiter(sch, postfix) {
    let comp=declareLMV331(sch,"UCL"+postfix);

    // low pass filter
    let rFilter=declareResistor(sch,"RCLF"+postfix,4700);
    let cFilter=declareCapacitor(sch,"CCLF"+postfix,"100n");
    let vrefNode=rFilter.pin(1);
    rFilter.pin(2).connect(comp.inMinus);
    cFilter.connect(comp.inMinus,"GND");

    // current sense
    let rSense=declareResistor(sch,"RCLS"+postfix,0.1);
    let loadNode=rSense.pin(1);
    rSense.pin(2).connect("GND");
    comp.inPlus.connect(loadNode);

    // comparator pull up
    let rPullup=declareResistor(sch,"RCLP"+postfix,4700);
    rPullup.connect("3V3",comp.out);

    // power
    comp.vcc.connect("3V3");
    comp.gnd.connect("GND");

    return {
        vref: vrefNode,
        shutdown: comp.out,
        load: loadNode
    };
}
