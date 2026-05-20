import {declareResistor, declarePinHeader, declareEsp32,
        declareTja1050, declareScrewTerminal, declareDrv8825,
        declareMp1584, declareCapacitor, declareMalePinHeader,
        declareDiode} from "../../js/pcb/component-declarations.js";

/*
research:

DPAK - TO-252

D2PAK - TO-263


IRFS7440 - USD 0.28 - 7203
PSMN1R1-40BS - USD 1.14 - 10
IPB100N04S4 - USD 3.35 - 5


gate driver: IR2104
mosfet: IRFS7440
*/

function declareLMV331(sch, ref) {
    let c=sch.declare(ref, {
        symbol: "Comparator:LMV331",
        footprint: "Package_SO:SOIC-5", // or SOT-23-5 if you prefer compact
        lcsc: "C7950" // LMV331 common LCSC family (adjust if needed)
    });

    //return compoundSymbol(c).namePins(["out","gnd","inPlus","inMinus","vcc"]);
    return compoundSymbol(c).namePins(["inPlus","gnd","inMinus","out","vcc"]);
}

function declareIR2104(sch, ref) {
    let c=sch.declare(ref, {
        symbol: "Driver_FET:IR2104",   // adjust to your KiCad lib name
        footprint: "Package_SO:SOIC-8",
        //lcsc: "C9694"
    });

    return compoundSymbol(c).namePins(["vcc","in","shutdown","com","lo","vs","ho","vb"]);
}

function declareMosfetD2PAK(sch, ref) {
    let c=sch.declare(ref, {
        symbol: "Transistor_FET:Q_NMOS_GDS",
        footprint: "Package_TO_SOT_THT:TO-263-2",
        //lcsc: "IRFS7440" // placeholder, replace with real LCSC if needed
    });

    return compoundSymbol(c).namePins(["gate","drain","source"]);
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

export function declareHalfBridge(sch, postfix) {
    let driver=declareIR2104(sch,"U"+postfix);
    let ql=declareMosfetD2PAK(sch,"QL"+postfix);
    let qh=declareMosfetD2PAK(sch,"QH"+postfix);
    let rl=declareResistor(sch,"RL"+postfix,10);
    let rh=declareResistor(sch,"RH"+postfix,10);
    let dboot=declareDiode(sch,"D"+postfix,"ss14");
    let cboot=declareCapacitor(sch,"C"+postfix,"100n");

    // bootstrap
    dboot.connect(driver.vb,driver.vcc);
    cboot.connect(driver.vb,driver.vs);

    // power
    driver.vcc.connect("12V");
    driver.com.connect("GND");

    // low side
    ql.drain.connect(driver.vs);
    //ql.source.connect("GND");
    rl.connect(driver.lo, ql.gate);

    // high side
    qh.drain.connect("12V");
    qh.source.connect(driver.vs);
    rh.connect(driver.ho, qh.gate);

    return ({
        shutdown: driver.shutdown,
        in: driver.in,
        return: ql.source
    });
}

export default async function(sch, {variant}) {
    let screw1=declareScrewTerminal(sch,"J1");
    let screw2=declareScrewTerminal(sch,"J2");
    let screw3=declareScrewTerminal(sch,"J3");
    let screw4=declareScrewTerminal(sch,"J4");
    let esp32=declareEsp32(sch,"U1","U2");
    let tja1050=declareTja1050(sch,"U3","U4");
    let mp1584=declareMp1584(sch,"U5","U6","U7","U8");
    let r1=declareResistor(sch,"R1",4700);
    let j5=declareMalePinHeader(sch,"J5",2);
    let r4=declareResistor(sch,"R4",330);
    let d1=declareDiode(sch,"D1","ss14");

    // Status LED
    j5.pin(1).connect("3V3");
    r4.connect(esp32.gpio8,j5.pin(2));

    // MCU
    esp32._5v.connect("5V");
    esp32._3v3.connect("3V3");
    esp32.gnd.connect("GND");

    // CAN
    tja1050.vcc.connect("5V");
    tja1050.tx.connect(esp32.gpio5);
    r1.connect(tja1050.rx,esp32.gpio4);
    tja1050.gnd.connect("GND");
    tja1050.canl.connect("CANL");
    tja1050.canh.connect("CANH");

    // Power
    mp1584.vin.connect("12V");
    mp1584.gndin.connect("GND");
    mp1584.gndout.connect("GND");
    d1.connect("5V",mp1584.vout);

    // Screw terminals
    screw1.connect("GND","12V","CANH","CANL");

    // business
    let cur1=declareCurrentLimiter(sch,"CUR1");
    cur1.vref.connect(esp32.gpio20);

    let h1=declareHalfBridge(sch,"10");
    cur1.shutdown.connect(h1.shutdown);
    esp32.gpio0.connect(h1.in);
    h1.return.connect(cur1.load);
}