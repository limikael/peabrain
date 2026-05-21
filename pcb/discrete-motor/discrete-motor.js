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
        footprint: "fixme!!!",
        //lcsc: "IRFS7440" // placeholder, replace with real LCSC if needed
    });

    return compoundSymbol(c).namePins(["gate","drain","source"]);
}

function delcareINA181(sch, ref) {
    let c=sch.declare(ref, {
        symbol: "Amplifier_Current:INA181",
        footprint: "Package_TO_SOT_SMD:SOT-23-6",
        lcsc: "C2058943"
    });

    return compoundSymbol(c).namePins(["out","gnd","inPlus","inMinus","vs","ref"]);
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
        return: ql.source,
        out: driver.vs
    });
}

function declareHalfBridgeStage(sch, refPostfix) {
    let h=declareHalfBridge(sch,refPostfix);
    let rsense=declareResistor(sch,"R"+refPostfix,0.01);
    rsense.connect(h.return,"GND");
    let amp=delcareINA181(sch,"UA"+refPostfix);
    amp.gnd.connect("GND");
    amp.ref.connect("GND");
    amp.vs.connect("3V3");
    rsense.connect(amp.inPlus,amp.inMinus);

    let csense=declareCapacitor(sch,"CSA"+refPostfix,"100n");
    csense.connect(amp.vs,amp.gnd);

    let rfilter=declareResistor(sch,"RF"+refPostfix,1000);
    let cfilter=declareCapacitor(sch,"CF"+refPostfix,"100n");

    amp.out.connect(rfilter.pin(1));
    cfilter.connect(rfilter.pin(2),"GND");

    return ({
        in: h.in,
        shutdown: h.shutdown,
        senseOut: rfilter.pin(2),
        out: h.out
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
    let h1=declareHalfBridgeStage(sch,"10");
    h1.in.connect(esp32.gpio0);
    h1.senseOut.connect(esp32.gpio1);
    h1.shutdown.connect(esp32.gpio21);
    h1.out.connect(screw4.pin(1));

    /*let h2=declareHalfBridgeStage(sch,"11");
    h2.in.connect(esp32.gpio2);
    h2.senseOut.connect(esp32.gpio3);
    h2.shutdown.connect(esp32.gpio21);
    h2.out.connect(screw4.pin(2));*/
}